import express, { Request, Response } from "express";
import { firebaseAuthorization } from "../middlewares";
import DataTalkException from "../types/exceptions";
import { DashboardParams, DataSource, DryWidgetConfig } from "../types/dashboards";
import { runSQLQuery } from "../services/bigquery";
import { hydrateWidgetConfig } from "../services/hydration";
import { generateSamplePrompts, makeGeminiRequest } from "../services/gemini";
import { getStoredServiceAccount } from "../services/projects";
import { firestore } from "../firebase";
import { getProjectDataContext } from "../services/context_data";
import { ChatMessage } from "../types/chat";

export const dataTalkRouter = express.Router();

dataTalkRouter.get("/health", check());
dataTalkRouter.post("/command", firebaseAuthorization(), processUserCommandRoute);
dataTalkRouter.post("/hydrate", firebaseAuthorization(), hydrateChartOrTableRoute);
dataTalkRouter.post("/prompt_suggestions", firebaseAuthorization(), samplePromptsRoute);

function getProjectIdFromSources(sources: DataSource[]) {
    console.log("Getting project id from sources", sources);
    if (sources.length === 0) {
        throw new DataTalkException(400, "You must specify at least one source", "Invalid request");
    }
    if (!sources.every(source => source.projectId === sources[0].projectId)) {
        // throw new DataTalkException(400, "All sources must belong to the same project", "Invalid request");
    }

    return sources[0].projectId;

}

async function processUserCommandRoute(request: Request, response: Response) {

    console.log(`Received request for command ${request.body.command}`);
    if (!request.body.command) {
        throw new DataTalkException(400, "Missing command param in the body", "Invalid request");
    }

    const sources: DataSource[] = request.body.sources;
    if (!sources) {
        throw new DataTalkException(400, "You must specify data sources in the body", "Invalid request");
    }

    const projectId = getProjectIdFromSources(sources);
    const credentials = await getStoredServiceAccount(firestore, projectId);

    const dataContexts = await Promise.all(sources.map(async ({
                                                                  projectId,
                                                                  datasetId
                                                              }) => {
        return getProjectDataContext(firestore, projectId, datasetId);
    })).catch((error: any) => {
        throw new DataTalkException(error.code, error.message, "internal");
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
        onDelta: (delta) => {
            console.log("Got delta", delta);
            response.write("&$# " + JSON.stringify({
                type: "delta",
                data: { delta }
            }));
        },
        onSQLQuery: (sqlQuery) => {
            console.log("Got SQL query", sqlQuery);
            response.write("&$# " + JSON.stringify({
                type: "sql",
                data: { sqlQuery }
            }));
        }
    });

    response.write("&$# " + JSON.stringify({
        type: "result",
        data: output
    }));
    response.end();
}

async function hydrateChartOrTableRoute(request: Request, response: Response) {
    if (!request.body.config) {
        throw new DataTalkException(400, "Missing config param in the body", "Invalid request");
    }

    const config: DryWidgetConfig = request.body.config;

    if (!config.sql) {
        throw new DataTalkException(400, "Missing sql in the config", "Invalid request");
    }

    const params: DashboardParams | undefined = request.body.params;

    console.log("Hydrating chart or table", config);
    const projectId = config.dataSource.projectId;
    console.log("Got project id", projectId);
    const credentials = await getStoredServiceAccount(firestore, projectId);

    const data = await runSQLQuery(config.sql, credentials, params);
    const res = hydrateWidgetConfig(config, data);

    response.json({ data: res });
}

async function samplePromptsRoute(request: Request, response: Response) {
    if (!request.body.dataSources) {
        throw new DataTalkException(400, "Missing dataSources param in the body", "Invalid request");
    }

    const dataSources: DataSource[] = request.body.dataSources;
    const chatHistory: ChatMessage[] = request.body.history;
    const res = await generateSamplePrompts({
        firestore: firestore,
        history: chatHistory,
        dataSources: dataSources
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

