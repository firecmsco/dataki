import express, { Request, Response } from "express";
import { firebaseAuthorization } from "../middlewares";
import DatakiException from "../types/exceptions";
import { DataSource, DateParams, DryWidgetConfig } from "../types/dashboards";
import { runSQLQuery } from "../services/bigquery";
import { hydrateChartConfig } from "../services/hydration";
import { generateSamplePrompts, makeGeminiRequest } from "../services/gemini";
import { getStoredServiceAccount } from "../services/projects";
import { firestore } from "../firebase";
import { getProjectDataContext } from "../services/context_data";
import { ChatMessage } from "../types/chat";

// @ts-ignore
import etag from "etag";

export const datakiRouter = express.Router();

datakiRouter.get("/health", check());
datakiRouter.post("/command", firebaseAuthorization(), processUserCommandRoute);
datakiRouter.post("/hydrate_chart", firebaseAuthorization(), hydrateChartRoute);
datakiRouter.post("/prompt_suggestions", firebaseAuthorization(), samplePromptsRoute);

async function processUserCommandRoute(request: Request, response: Response) {

    console.log(`Received request for command ${request.body.command}`);
    if (!request.body.command) {
        throw new DatakiException(400, "Missing command param in the body", "Invalid request");
    }

    const sources: DataSource[] = request.body.sources;
    if (!sources) {
        throw new DatakiException(400, "You must specify data sources in the body", "Invalid request");
    }

    const initialWidgetConfig: DryWidgetConfig | undefined = request.body.initialWidgetConfig;

    const projectId = request.body.projectId;
    const credentials = await getStoredServiceAccount(firestore, projectId);

    const dataContexts = await Promise.all(sources.map(async ({
                                                                  projectId,
                                                                  datasetId
                                                              }) => {
        return getProjectDataContext(firestore, projectId, datasetId);
    })).catch((error: any) => {
        throw new DatakiException(error.code, error.message, "internal");
    });

    response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked"
    });

    const output = await makeGeminiRequest({
        userQuery: request.body.command,
        dataContexts,
        history: request.body.history || [],
        credentials,
        initialWidgetConfig,
        onDelta: (delta) => {
            console.log("Got delta", delta);
            response.write("&$# " + JSON.stringify({
                type: "delta",
                data: { delta }
            }));
        },
        onFunctionCall: (call) => {
            console.log("Got Function call query", call);
            response.write("&$# " + JSON.stringify({
                type: "function_call",
                data: { call }
            }));
        }
    });

    response.write("&$# " + JSON.stringify({
        type: "result",
        data: output
    }));
    response.end();
}

async function hydrateChartRoute(request: Request, response: Response) {
    if (!request.body.config) {
        throw new DatakiException(400, "Missing config param in the body", "Invalid request");
    }

    const config: DryWidgetConfig = request.body.config;

    if (!config.sql) {
        throw new DatakiException(400, "Missing sql in the config", "Invalid request");
    }

    const params: DateParams | undefined = request.body.params;

    console.log("Hydrating chart or table", config);
    const projectId = config.projectId;
    console.log("Got project id", projectId);
    const credentials = await getStoredServiceAccount(firestore, projectId);

    const data = await runSQLQuery({
        sql: config.sql,
        credentials: credentials,
        params: params
    });
    const res = hydrateChartConfig(config, data);

    response.setHeader("Cache-Control", "public, max-age=31536000");
    response.setHeader("ETag", etag(JSON.stringify(res)));
    response.json({ data: res });
}

async function samplePromptsRoute(request: Request, response: Response) {
    if (!request.body.dataSources) {
        throw new DatakiException(400, "Missing dataSources param in the body", "Invalid request");
    }

    const dataSources: DataSource[] = request.body.dataSources;
    const chatHistory: ChatMessage[] = request.body.history;
    const initialWidgetConfig: DryWidgetConfig | undefined = request.body.initialWidgetConfig;

    const res = await generateSamplePrompts({
        firestore: firestore,
        history: chatHistory,
        dataSources: dataSources,
        initialWidgetConfig
    })

    response.json({ data: res });
}

function check() {
    return (request: Request, response: Response) => {
        console.log(JSON.stringify({
            labels: {
                function_name: "check"
            },
            "endpoint": request.path,
            "message": "Health check"
        }))

        response.status(200).json({ "message": "Ok" });
    }
}

