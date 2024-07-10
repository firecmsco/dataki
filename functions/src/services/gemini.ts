import { ChatMessage } from "../types/chat";
import { runSQLQuery } from "./bigquery";
import { getGoogleProjectId } from "../auth/auth";
import {
    FunctionDeclarationSchemaType,
    GenerateContentResponse,
    GenerativeModelPreview,
    Tool,
    VertexAI,
} from "@google-cloud/vertexai";
import { Part } from "@google/generative-ai";
import * as util from "util";
import { ServiceAccountKey } from "../types/service_account";
import { CommandMessage } from "../types/command";
import { DataSource } from "../types/items";
import { getProjectDataContext } from "./context_data";
import DataTalkException from "../types/exceptions";

const PREFERRED_COLORS = ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"];

// const genaiapikey = process.env.GEN_AI_API_KEY;
// if (!genaiapikey) {
//     throw new Error("GEN_AI_API_KEY is not set");
// }
// const genAI = new GoogleGenerativeAI(genaiapikey);
//
// export const getGenAI = async (): Promise<GenerativeModel> => {
//     const model = "gemini-1.5-pro";
//     return genAI.getGenerativeModel({
//         model: model,
//         generationConfig: {
//             maxOutputTokens: 2048,
//             temperature: 1,
//             topP: 0.95
//         },
//         tools: [makeSQLQueryFunctionDeclaration],
//     }, { apiVersion: 'v1beta' });
// }
export const getVertexAI = async (): Promise<GenerativeModelPreview> => {
    const model = "gemini-1.5-pro";
    const projectId = await getGoogleProjectId();
    const vertex_ai = new VertexAI({
        project: projectId,
        location: "europe-west3"
    });
    return vertex_ai.preview.getGenerativeModel({
        model: model,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 1,
            topP: 0.95
        },
        tools: [makeSQLQueryFunctionDeclaration],
    }, { apiClient: "v1beta" },);
}

export async function makeGeminiRequest({
                                            userQuery,
                                            dataContexts,
                                            onDelta,
                                            history,
                                            credentials
                                        }:
                                            {
                                                userQuery: string,
                                                dataContexts: string[],
                                                onDelta: (delta: string) => void,
                                                history: ChatMessage[],
                                                credentials?: ServiceAccountKey
                                            }): Promise<string> {

    const geminiModel = await getVertexAI();

    const functions = {
        makeSQLQuery: ({ sql }: { sql: string }) => {
            return runSQLQuery(sql, credentials)
        }
    };

    const dataContext = dataContexts.join("\n\n");
    const instructions = `You are a tool that allows user to query their BigQuery datasets and generate
charts, tables or give answers in natural language. The charts and tables you generate can be added to dashboards.
You are able to understand the user's query and generate the SQL query that will fetch the data the user is asking for.
You can output a mix of markdown and JSON, exclusively.

For some queries, you may need to fetch data from BigQuery to provide a better answer.

When generating JSON configs, they need to follow a very specific format, that will be used by the frontend to render the chart.
The frontend will replace the placeholders in the JSON with the actual data.

If you can provide the answer in natural language, you should do so, but you can also generate a chart or table config in JSON format.
You should try to be brief and return just the chart or table config when requested to, but you can also provide a mix of markdown and JSON.
Or even only text if the user is asking for instructions, or answers you can provide in natural language.

When asked for data, NEVER make it up, always fetch it from BigQuery.
You proactively make calls to makeSQLQuery to fetch the data you need to answer the user's question, do not ask the 
user permission to fetch the data, as you already have it.
Remember, you have the ability to query the database using makeSQLQuery(sql). Do not guess or make up answers, always rely on the data

---

The datasets you can query are:

${dataContext}.

---

Chart and table generation:

- You can either generate a chart or a table config in JSON format, or include additional instructions in markdown.
- You can also call the function makeSQLQuery to fetch data from BigQuery. That function allows you to answer
questions in natural language, by fetching the data from BigQuery and then generating the response.
- Some data really doesn't make sense to be displayed in a chart, so you should return it in a table format.
Do NOT generate "choropleth" charts, as they are not supported by the frontend.

When you are generating chart or table configs, the JSON need to look like this:

\`\`\`json
{
    "title": "Sample chart title",
    "description" : "Provide a small description of what this widget displays",
    "type": "chart",
    "dataSource": {
        "projectId": "your-project-id",
        "datasetId": "your-dataset-id"
    },
    "sql": "SELECT * FROM table",
    "chart":{
        "type": "bar",
        "data": {
            "labels": "[[label_mapping_key]]",
            "datasets": [
                {
                    "label": "Column 1",
                    "data": [[data_mapping_key]],
                    "backgroundColor": [${PREFERRED_COLORS.map(c => "\"" + c + "\"").join(", ")}]
                }
            ]
        }
    }
}
\`\`\`

- It is vital that the JSON is CORRECTLY FORMED. Do NOT use triple quotes """
- When generating a chart config, it must ALWAYS be tied to the related SQL via placeholders, you should never 
include data directly in the chart json. That way the config can be persisted and run in the future 
with always up to date data. Remember you are a tool for building dashboards.
NEVER include data in the chart or table configuration. ALWAYS use placeholders that will be replaced with 
up to date data.
- There should NEVER be a place holder inside an array. NEVER DO THIS:
\`\`\`json
"data": [
  "[[total_sold]]"
],
\`\`\`
- Placeholders should be ALWAYS added like this:
\`\`\`json
"data": "[[total_sold]]",
\`\`\`


---
SQL:

- You need to generate a SQL query that will return the data the user is asking for.
- The SQL will run in BigQuery. The result of running the SQL must always be an array of objects.
- Write human-readable SQL queries that are easy to understand, and DO NOT USE keys like t1, t2, t3, etc. Use
names like 'products', 'sales', 'customers', 'count', 'average', or whatever makes sense.
- You should tend to apply limits to the number of rows returned by the SQL query to avoid performance issues, unless the user explicitly asks for all the data.
- Write the simplest SQL query that will return the data the user is asking for.
- If the user asks for the average, sum, count, etc., you should return the result of that operation.
- Try to include the ID of the row in the result, where applicable.
- The SQL you generate should be human readable, so include line breaks and indentation where appropriate.
- Double-check the SQL you generate to make sure it is correct and will return the data the user is asking for.
- For BigQuery SQL, make sure to include the project and dataset in the query, e.g. \`SELECT * FROM project.dataset.table\`.
- When building SQL for a chart, make sure you SELECT at least 2 attributes, since charts need at least 2 dimensions (e.g. a distinct value and a count)

---
Hydration:

For charts and tables, once the data is fetch, the backend will iterate through the data and replace the placeholders in the JSON with the actual data.
e.g. "[[city]]" will be replaced with an array of the value for key 'city' of each entry in the data, and will be used as labels in the chart. 
IMPORTANT: the placeholder must be a string, not an array containing a string.

This process is called hydration. The frontend will use the hydrated JSON to render the chart or table.
It is very important that the fields that include placeholders are correctly named and match the keys in the data,
and they will ALWAYS be replaced with an array mapped to the fetched data. They should not be used for anything else.

Please always use these colors when required: ${PREFERRED_COLORS.join(", ")} (or similar ones if you need more).
You usually do not need to include the color in the JSON, you only need it for more complex charts.

If you are generating a table, the JSON should look like this:
\`\`\`json
{
    "title": "Sample table title",
    "description" : "Provide a small description of what this widget displays",
    "type": "table",
    "dataSource": {
        "projectId": "your-project-id",
        "datasetId": "your-dataset-id"
    },
    "sql": "SELECT * FROM table",
    "table": {
        "columns": [
            {"key": "purchase_date", "name": "Purchase Date", "dataType": "date"},
            {"key": "name", "name": "Purchase Name", "dataType": "string"},
        ]
    }
}
\`\`\`

The possible data types are: "string", "number", "date", "object", "array"

You MUST include \`\`\`json
\`\`\` in your response, if generating data config.

Important: you can fetch some data from BigQuery using the function makeSQLQuery, for better context on the data you are working with.
For example, you may want to make a distinct select query for getting the possible values of a column, 
or a count query to get the number of rows in a table. 

You should not return \`\`\`sql blocks in your response, only \`\`\`json with chart or table configs, or answers in natural language.
You should proactively make calls to makeSQLQuery to fetch the data you need to answer the user's question.
`;
    console.log(instructions);

    const chat = geminiModel.startChat({
        systemInstruction: {
            parts: [{
                text: instructions
            }],
            role: "user"
        },
        history: history.map((message) => ({
            parts: [{ text: message.text }],
            role: message.user === "SYSTEM"
                ? "model"
                : "user"
        }))
    });

    let totalDelta = "";

    async function sendMessage(request: string | Array<string | Part>) {
        const streamingResult = await chat.sendMessageStream(request);
        for await (const item of streamingResult.stream) {
            await processStreamingItem(item);
        }
    }

    await sendMessage(userQuery);

    async function processStreamingItem(item: GenerateContentResponse) {
        console.log(util.inspect(item, false, null, true /* enable colors */) + "\n\n");

        const candidate = item.candidates?.[0];
        if (candidate?.finishReason) {
            return;
        }
        const part = candidate?.content.parts[0];
        if (part?.functionCall) {
            const functionName = part.functionCall.name;
            const functionParams = part.functionCall.args;
            const functionResponse = await functions[functionName](functionParams);
            await sendMessage([{
                functionResponse: {
                    name: functionName,
                    response: { functionResponse }
                }
            }])
        } else if (part?.text) {
            const delta = part?.text;
            if (delta) {
                onDelta(delta);
                totalDelta += delta;
            }
        } else {
            console.warn("Unknown part", part);
        }
    }

    return totalDelta;

    // let textResult = "";
    // const parser = new LLMOutputParser(onDelta);
    // const result = await chat.sendMessageStream(userQuery);
    // for await (const item of result.stream) {
    //     const delta = item.candidates?.[0].content.parts[0].text;
    //     textResult += delta;
    //     if (delta) {
    //         parser.parseDelta(delta);
    //     }
    // }
    // console.log(textResult);
    // return parser.getFinalState();

}

// Function declaration, to pass to the model.
const makeSQLQueryFunctionDeclaration: Tool = {
    functionDeclarations: [{
        name: "makeSQLQuery",
        parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            description: "Make a BigQuery SQL request, try to limit the number of rows returned.",
            properties: {
                sql: {
                    type: FunctionDeclarationSchemaType.STRING,
                    description: "The SQL query to run in BigQuery",
                }
            },
            required: ["sql"]
        }
    }]
};

export const generateSamplePrompts = async (
    {
        firestore,
        history,
        dataSources
    }: {
        firestore: FirebaseFirestore.Firestore,
        history: Array<CommandMessage> | undefined,
        dataSources: DataSource[]
    }
): Promise<string[]> => {

    const dataContexts = await Promise.all(dataSources.map(async ({
                                                                      projectId,
                                                                      datasetId
                                                                  }) => {
        return getProjectDataContext(firestore, projectId, datasetId);
    })).catch((error: any) => {
        throw new DataTalkException(error.code, error.message, "internal");
    });

    const systemInstruction = buildSamplePromptsSystemInstructions(dataContexts)
    console.log("Result prompt");
    console.log(systemInstruction);
    const geminiModel = await getVertexAI();
    const chat = geminiModel.startChat({
        systemInstruction: {
            parts: [{ text: systemInstruction }],
            role: "user"
        },
        history: history?.map((message) => ({
            parts: [{ text: message.text }],
            role: message.user === "SYSTEM"
                ? "model"
                : "user"
        }))
    });
    const llmResult = await chat.sendMessage("Give me 5 prompts based on the data you have in the BigQuery datasets, and the chat history. Your outcome MUST be a JSON with an array of 5 prompts.");
    const candidates = llmResult.response.candidates;
    if (candidates && candidates.length > 0) {
        const firstCandidate = candidates[0];
        if (!firstCandidate.content.parts) return [];
        console.log(firstCandidate.content.parts);
        const result = firstCandidate.content.parts?.map((part) => part.text).join("");
        const cleanedResult = result
            .replace(/```JSON/g, "")
            .replace(/```json/g, "")
            .replace(/```JSON5/g, "")
            .replace(/```json5/g, "")
            .replace(/```/g, "");
        console.log({
            result,
            cleanedResult
        });
        return JSON.parse(cleanedResult);
    }
    throw new Error("No prompts found");
}

export const buildSamplePromptsSystemInstructions = (dataContexts: string[]): string => {
    return `I need you to give me 5 sample prompts for a ChatBot named DATATALK.
DATATALK allows users to make questions to their BigQuery datasets in natural language.

You ALWAYS return a JSON with an array of 5 sample prompts like:
\`\`\`JSON
["Give me the products with a price bigger than 500 dollars",
"Books of travel and fiction",
"Show me the books that are in stock",
"Create a chart with the sales of the last month",
"Show me all posts from the last month"]
\`\`\`

You may also receive the current chat history in the request. You can use this information to generate the prompts.

You need to adapt the prompts to the data you have in the given BigQuery tables. 
Here is a summary of the collections and fields you have in your database:


BIGQUERY DATASETS:

${dataContexts.join("\n\n")}


Your output will be parsed by a script so it MUST always be in the same format.
`;
}
