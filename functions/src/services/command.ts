import { getProjectDataContext } from "./context_data";
import { ChatMessage } from "../types/chat";

import { GenerativeModelPreview, VertexAI } from "@google-cloud/vertexai";
import { getGoogleProjectId } from "../services/auth";

const PREFERRED_COLORS = ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"]

export const getVertexAI = async (): Promise<GenerativeModelPreview> => {
    const projectId = await getGoogleProjectId();
    const vertex_ai = new VertexAI({
        project: projectId,
        location: "europe-west3"
    });
    const model = "gemini-1.5-pro-preview-0409";
    return vertex_ai.preview.getGenerativeModel({
        model: model,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 1,
            topP: 0.95
        }
    });
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
    const instructions = `You are a tool that allows user to query their BigQuery datasets and generate
charts. You are able to understand the user's query and generate the SQL query that will fetch the data the user is asking for.
You can output a mix of markdown and JSON, exclusively.

When generating JSON configs, they need to follow a very specific format, that will be used by the frontend to render the chart.
The frontend will replace the placeholders in the JSON with the actual data.

You should try to be brief and return just the chart or table config when requested to, but you can also provide a mix of markdown and JSON.
Or even only text if the user is asking for instructions.

---

The dataset you need to query is ${projectId}.${datasetId}.

${await getProjectDataContext(projectId, datasetId)}.

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
                    "backgroundColor": ${PREFERRED_COLORS}
                }
            ]
        },
        "options": {
            "plugins": {
                "legend": {
                    "position": "right"
                }
            },
            "scales": {}
        }
    }
}
\`\`\`

You need to generate a SQL query that will return the data the user is asking for.
The SQL will run in BigQuery.
The result of running the SQL must always be an array of objects.
Write human-readable SQL queries that are easy to understand, and avoid names like t1, t2, t3, etc. Use
names like 'products', 'sales', 'customers', 'count', 'average', etc.
You should tend to apply limits to the number of rows returned by the SQL query to avoid performance issues, unless the user explicitly asks for all the data.
Write the simplest SQL query that will return the data the user is asking for.

Once the data is fetch, the backend will iterate through the data and replace the placeholders in the JSON with the actual data.
e.g. "{{city}}" will be replaced with the values of the column that will be used as labels in the chart. 

For the charts, prefer the legend to be on the right side of the chart, unless specified otherwise by the user.
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
\`\`\` in your response, if generating data config.\n`;
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

    const result = await chat.sendMessageStream(userQuery);
    let totalDelta = "";
    for await (const item of result.stream) {
        const delta = item.candidates?.[0].content.parts[0].text;
        if (delta) {
            onDelta(delta);
            totalDelta += delta;
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
