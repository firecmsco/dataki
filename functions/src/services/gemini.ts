import { getProjectDataContext } from "./context_data";
import { ChatMessage } from "../types/chat";
import { runSQLQuery } from "./bigquery";
import * as util from "util";
import { getGoogleProjectId } from "./auth";
import {
    FunctionDeclarationSchemaType,
    GenerateContentResponse,
    GenerativeModelPreview,
    Tool,
    VertexAI,
} from "@google-cloud/vertexai";

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
                                            userQuery, datasetId, projectId, onDelta, history
                                        }:
                                            {
                                                userQuery: string,
                                                projectId: string,
                                                datasetId: string,
                                                onDelta: (delta: string) => void,
                                                history: ChatMessage[]
                                            }): Promise<string> {

    const geminiModel = await getVertexAI();
    const dataContext = await getProjectDataContext(projectId, datasetId);
    const instructions = `You are a tool that allows user to query their BigQuery datasets and generate
charts, tables or give answers in natural language.
You are able to understand the user's query and generate the SQL query that will fetch the data the user is asking for.
You can output a mix of markdown and JSON, exclusively.

When generating JSON configs, they need to follow a very specific format, that will be used by the frontend to render the chart.
The frontend will replace the placeholders in the JSON with the actual data.

You should try to be brief and return just the chart or table config when requested to, but you can also provide a mix of markdown and JSON.
Or even only text if the user is asking for instructions, or answers you can provide in natural language.

---

The dataset you need to query is ${projectId}.${datasetId}.

${dataContext}.

---

You can either generate a chart or a table config in JSON format, or include additional instructions in markdown.
You can also call the function makeSQLQuery to fetch data from BigQuery. That function allows you to answer
questions in natural language, by fetching the data from BigQuery and then generating the response.

---

When you are generating chart or table configs, the JSON need to look like this:

\`\`\`json
{
    "type": "chart",
    "sql": "SELECT * FROM table",
    "chart":{
        "type": "bar",
        "data": {
            "labels": "{{label_mapping_key}}",
            "datasets": [
                {
                    "label": "Column 1",
                    "data": {{data_mapping_key}},
                    "backgroundColor": [${PREFERRED_COLORS.map(c => '"' + c + '"').join(", ")}]
                }
            ]
        }
    }
}
\`\`\`

---
SQL:

- You need to generate a SQL query that will return the data the user is asking for.
- The SQL will run in BigQuery. The result of running the SQL must always be an array of objects.
- Write human-readable SQL queries that are easy to understand, and avoid names like t1, t2, t3, etc. Use
names like 'products', 'sales', 'customers', 'count', 'average', etc.

- You should tend to apply limits to the number of rows returned by the SQL query to avoid performance issues, unless the user explicitly asks for all the data.
- Write the simplest SQL query that will return the data the user is asking for.
- If the user asks for the average, sum, count, etc., you should return the result of that operation.
- Try to include the ID of the row in the result, where applicable.

---
Hydration:

Once the data is fetch, the backend will iterate through the data and replace the placeholders in the JSON with the actual data.
e.g. "{{city}}" will be replaced with an array of the value for key 'city' of each entry in the data, and will be used as labels in the chart. 

Please always use these colors when required: ${PREFERRED_COLORS.join(", ")} (or similar ones if you need more).

If you are generating a table, the JSON should look like this:
\`\`\`json
{
  "type": "table",
  "sql": "SELECT * FROM table",
  "table": {
    "columns": [
      {"name": "Purchase Date", "mapping": "{{created_at}}"},
      {"name": "Product Name", "mapping": "{{product_name}}"}
    ]
  }
}
\`\`\`

You MUST include \`\`\`json
\`\`\` in your response, if generating data config.

Important: fetch some data from BigQuery using the function makeSQLQuery, for better context on the data you are working with.
\n`;
    // console.log(instructions);

//     const _instructions = `You are a tool that can query BigQuery using a function called makeSQLQuery. You must always make a call to this function to fetch the data and then answer the user question in natural language.
//
// The dataset you need to query is ${projectId}.${datasetId}.
// This is the context of the data you are working with:
//
//     ${dataContext}`;


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

    const streamingResult = await chat.sendMessageStream(userQuery);
    let totalDelta = "";

    async function processStreamingItem(item: GenerateContentResponse) {
        console.log(util.inspect(item, false, null, true /* enable colors */) + "\n\n");
        const part = item.candidates?.[0].content.parts[0];
        if (part?.functionCall) {
            const functionName = part.functionCall.name;
            const functionParams = part.functionCall.args;
            const functionResponse = await functions[functionName](functionParams);
            // console.log(functionResponse);
            const streamingResult2 = await chat.sendMessageStream([{
                functionResponse: {
                    name: functionName,
                    response: { functionResponse }
                }
            }]);
            // console.log(util.inspect(streamingResult2, false, null, true /* enable colors */) + "\n\n");
            for await (const item of streamingResult2.stream) {
                await processStreamingItem(item);
            }
        } else {
            const delta = part?.text;
            if (delta) {
                onDelta(delta);
                totalDelta += delta;
            }
        }
    }

    for await (const item of streamingResult.stream) {
        await processStreamingItem(item);
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
            required: ["sql"],
        },
    }]
};

// Executable function code. Put it in a map keyed by the function name
// so that you can call it once you get the name string from the model.
const functions = {
    makeSQLQuery: ({ sql }: { sql: string }) => {
        return runSQLQuery(sql)
    }
};
