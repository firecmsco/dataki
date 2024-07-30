import { ChatMessage } from "../types/chat";
import { runSQLQuery } from "./bigquery";
import { getGoogleProjectId } from "../auth/auth";
import {
    FunctionDeclarationSchemaType,
    GenerateContentResponse,
    GenerativeModelPreview,
    Tool,
    VertexAI
} from "@google-cloud/vertexai";
import { Part } from "@google/generative-ai";
import * as util from "util";
import { ServiceAccountKey } from "../types/service_account";
import { CommandMessage } from "../types/command";
import { DataSource, DryWidgetConfig } from "../types/dashboards";
import { getProjectDataContext } from "./context_data";
import DataTalkException from "../types/exceptions";

const PREFERRED_COLORS = ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"];

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
        tools: [makeSQLQueryFunctionDeclaration]
    }, { apiClient: "v1beta" });
}

export async function makeGeminiRequest({
                                            userQuery,
                                            dataContexts,
                                            onDelta,
                                            onSQLQuery,
                                            history,
                                            credentials,
                                            initialWidgetConfig
                                        }:
                                            {
                                                userQuery: string,
                                                dataContexts: string[],
                                                onDelta: (delta: string) => void,
                                                onSQLQuery?: (sql: string) => void,
                                                history: ChatMessage[],
                                                credentials?: ServiceAccountKey,
                                                initialWidgetConfig?: DryWidgetConfig
                                            }): Promise<string> {

    const geminiModel = await getVertexAI();

    const functions = {
        makeSQLQuery: ({ sql }: { sql: string }) => {
            onSQLQuery && onSQLQuery(sql);
            return runSQLQuery({
                sql: sql,
                credentials: credentials
            })
        }
    };

    const dataContext = dataContexts.join("\n\n");
    const colors = [...PREFERRED_COLORS];
    shuffle(colors);

    const instructions = `You are a tool that allows user to query their BigQuery datasets and generate
charts, tables or give answers in natural language. The charts and tables you generate can be added to dashboards.
You are able to understand the user's query and generate the SQL query that will fetch the data the user is asking for.
You can output a mix of markdown and JSON, exclusively.

For some queries, you may need to fetch data from BigQuery to provide a better answer.

The current time is: ${new Date().toLocaleString()}.

When generating JSON configs, they need to follow a very specific format, that will be used by the frontend to render the chart.
The frontend will replace the placeholders in the JSON with the actual data.

If you can provide the answer in natural language, you should do so, but you can also generate a chart or table config in JSON format.
You should try to be brief and return the chart or table config when requested to, but you can also provide a mix of markdown and JSON.
Or even only text if the user is asking for instructions, or answers you can provide in natural language.

You should usually include a small description of what the widget displays, before the chart or table.

When returning data as text, try to set in bold the most important information, like the total, the average, etc.
Also, when returning a list, try to use bullet points to make it easier to read.

When asked for data, NEVER make it up, always fetch it from BigQuery.
You proactively make calls to \`makeSQLQuery(sql:string)\` to fetch the data you need to answer the user's question, do not ask the 
user permission to fetch the data, as you already have it.
Remember, you have the ability to query the database using \`makeSQLQuery(sql:string)\`. Do not guess or make up answers, always rely on the data.
You should not return \`\`\`sql blocks in your response, only \`\`\`json with chart or table configs, or answers in natural language.

---

The datasets you can query are:

${dataContext}.

---

Chart and table generation:

- You can either generate a chart or a table config in JSON format, or include additional instructions in markdown.
- You can also call the internal function \`makeSQLQuery(sql:string)\` to fetch data from BigQuery. That function allows you to answer
questions in natural language, by fetching the data from BigQuery and then generating the response.
- Some data really doesn't make sense to be displayed in a chart, so you should return it in a table format.
Do NOT generate "choropleth" charts, as they are not supported by the frontend.

* Charts:
When you are generating chart configs, the JSON need to look like this:

\`\`\`json
{
    "title": "Sample chart title",
    "description" : "Provide a small description of what this widget displays",
    "type": "chart",
    "sql": "SELECT label_mapping_key, data_mapping_key, another_mapping_key FROM \`table\` WHERE date BETWEEN @DATE_START AND @DATE_END",
    "chart":{
        "type": "bar",
        "data": {
            "labels": "[[label_mapping_key]]",
            "datasets": [
                {
                    "label": "Column 1",
                    "data": "[[data_mapping_key]]",
                    "backgroundColor": ${colors[0]}
                },
                {
                    "label": "Column 2",
                    "data": "[[another_mapping_key]]",
                    "backgroundColor": ${colors[1]}
                }
            ]
        },
        "options": {
            "scales": {
              "x": {
                    "title": {
                      "display": "true",
                      "text": "Month"
                    }
              },
              "y": {
                    "title": {
                      "display": "true",
                      "text": "Title of the Y axis"
                    }
              }
           }
        }
    }
}
\`\`\`

Bar charts use the \`backgroundColor\` property to set the color of the bars. 
Line charts use the \`borderColor\` property to set the color of the line.

You may also want to generate the labels based on the query. You can specify this format for generating a dataset 
per entry. If your data has triplets with keys 'sales_date', 'daily_sales' and 'product_category', you can generate
a chart config like this.

\`\`\`json
{
  "data": {
    "labels": "[[sales_date]]",
    "datasets": [
      {
        "data": "[[daily_sales]]((product_category))",
        "label": "((product_category))"
      }
    ]
  }
}
\`\`\`
(when hydrated, this will generate a dataset for each product category, with the sales_date as labels)

- It is vital that the JSON is CORRECTLY FORMED. Do NOT use triple quotes """
- When generating a chart config, it must ALWAYS be tied to the related SQL via placeholders, you should never 
include data directly in the chart json. That way the config can be persisted and run in the future 
with always up to date data. Remember you are a tool for building dashboards.
NEVER include data in the chart or table configuration. ALWAYS use placeholders that will be replaced with 
up to date data.
- There should NEVER be a placeholder inside an array. NEVER DO THIS:
\`\`\`json
"data": [
  "[[total_sold]]"
],
\`\`\`
- Placeholders should be ALWAYS added like this:
\`\`\`json
"data": "[[total_sold]]",
\`\`\`
or
\`\`\`json
"data": "[[total_sold]](product_category)",
\`\`\`
- The scales object in the options is optional, but you should include it when it makes sense.


* Tables:
If you are generating a table, the JSON should look like this:
\`\`\`json
{
    "title": "Sample table title",
    "description" : "Provide a small description of what this widget displays",
    "type": "table",
    "sql": "SELECT * FROM table WHERE date BETWEEN @DATE_START AND @DATE_END",
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

---
SQL:

- You need to generate a SQL query that will return the data the user is asking for.
- The SQL will run in BigQuery. The result of running the SQL must always be an array of objects.
- Write human-readable SQL queries that are easy to understand, and DO NOT USE keys like t1, t2, t3, etc. Use
names like 'products', 'sales', 'customers', 'count', 'average', or whatever makes sense.
- Do not worry about applying limits to the SQL queries, the backend will take care of that.
- If the user asks for the average, sum, count, etc., you should return the result of that operation, by using \`makeSQLQuery(sql:string)\`.
- Try to include the ID of the row in the result, where applicable.
- The SQL you generate should be human readable, so INCLUDE line breaks and indentation where appropriate.
- For BigQuery SQL, make sure to include the project and dataset in the query, e.g. \`SELECT * FROM project.dataset.table\` (but not in the attributes!)
- When building SQL for a chart, make sure you SELECT at least 2 attributes, since charts need at least 2 dimensions (e.g. a distinct value and a count)
- You should provide the params @DATE_START and @DATE_END in the SQL query, so the user can filter the data by date. 
  Add those parameters whenever you can, so the user can filter the data by date range.
- The @DATE_START and @DATE_END are of type TIMESTAMP. So make sure whenever you use them in the SQL query, 
  make sure the value you are comparing is casted to TIMESTAMP.
- Be specially careful when generating SQL queries that include dates. Your SQL should be able to handle date ranges,
  CAST TO TIMESTAMP: like 'TIMESTAMP(covid19_open_data.date) BETWEEN @DATE_START AND @DATE_END'
- Do not use a subquery in a JOIN predicate.
- When generating tables, include also columns that are useful, typically all the columns from the main
  table being requested, and possibly some additional ones that are useful for the user to understand the data.
  For tables too, include the @DATE_START and @DATE_END parameters in the SQL query, so the user can filter the data by date.
- Remember to write SQL queries in valid BigQuery SQL syntax, and make sure the table names you use have been provided in the context data.
- Whenever you are generating SQL queries, TEST IT (with VERY limited results), using \`makeSQLQuery(sql:string)\`. Make sure the query is correct and returns the data you expect.
You do NOT need to include the used SQL in the responses.
- Usually when generating charts, the timestamps should be in the x-axis, and converted to days, months, or years, depending on the data,
unless the user asks otherwise.

---
Hydration:

For charts and tables, once the data is fetch, the backend will iterate through the data and replace the placeholders in the JSON with the actual data.
e.g. "[[city]]" will be replaced with an array of the value for key 'city' of each entry in the data, and will be used as labels in the chart. 
IMPORTANT: the placeholder must be a string, not an array containing a string.

This process is called hydration. The frontend will use the hydrated JSON to render the chart or table.
It is very important that the fields that include placeholders are correctly named and match the keys in the data,
and they will ALWAYS be replaced with an array mapped to the fetched data. They should not be used for anything else.

Please always use these colors when required: ${colors.join(", ")} (or similar ones if you need more).

Important: you can fetch some data from BigQuery using the function makeSQLQuery, for better context on the data you are working with.
For example, you may want to make a distinct select query for getting the possible values of a column, 
or a count query to get the number of rows in a table. 

You should not return \`\`\`sql blocks in your response, only \`\`\`json with chart or table configs, or answers in natural language.
IMPORTANT: You should proactively make calls to makeSQLQuery to fetch the data you need to answer the user's question. Also to verify
the SQL is correct.

` + (
        initialWidgetConfig
            ? `
In this particular instance of the chat, your goal is to modify an existing widget:
\`\`\`
${JSON.stringify(initialWidgetConfig)}
\`\`\`

All your interactions should be aimed at returning different versions of the widget, based on the user requests.
In this mode, the config you generate should always include the provided id: ${initialWidgetConfig.id}`
            : "");

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
            // @ts-ignore
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

    // if running in debug mode
    // if (process.env.NODE_ENV === "development") {
    //     console.log("Saving to file:");
    const fs = require("fs");
    fs.writeFileSync("gemini_output.txt", totalDelta);
    // }

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
            description: "Make a BigQuery SQL request.",
            properties: {
                sql: {
                    type: FunctionDeclarationSchemaType.STRING,
                    description: "The SQL query to run in BigQuery"
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
        dataSources,
        initialWidgetConfig
    }: {
        firestore: FirebaseFirestore.Firestore,
        history: Array<CommandMessage> | undefined,
        dataSources: DataSource[],
        initialWidgetConfig?: DryWidgetConfig
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

    const systemInstruction = buildSamplePromptsSystemInstructions(dataContexts, initialWidgetConfig)

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
    const llmResult = await chat.sendMessage("Give me 4 prompts based on the data you have in the BigQuery datasets, and the chat history. Your outcome MUST be a JSON with an array of 4 prompts.");
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
            cleanedResult
        });
        return JSON.parse(cleanedResult);
    }
    throw new Error("No prompts found");
}

export const buildSamplePromptsSystemInstructions = (dataContexts: string[], initialWidgetConfig?: DryWidgetConfig): string => {
    return `I need you to give me 4 sample prompts for a ChatBot named DATATALK.
DATATALK allows users to make questions to their BigQuery datasets in natural language.

Here is a summary of the collections and fields you have in your database.
BIGQUERY DATASETS:

${dataContexts.join("\n\n")}

You need to adapt the prompts to the data you have in the given BigQuery tables. 

You ALWAYS return a JSON with an array of 4 sample prompts like:
\`\`\`JSON
[
"Can you suggest some useful charts with this data?",
"Create a pie chart with the sales per category",
"Create a table with the top 10 products by sales",
"Show me new users in a line chart"
]
\`\`\`

Try to think of the most common questions users might ask about the data you have in the BigQuery datasets.
Especially related to data you would have in an analytics dashboard.
Probably not count operations, but more like "Show me the sales of the last month", "Create a chart with the sales of the last month", etc.

You may also receive the current chat history in the request. In that case, always try to follow up with suggestions
for questions the user may want to make based on the data you have in the BigQuery datasets.

Do not suggest generating maps.

Your output will be parsed by a script so it MUST always be in the same format.
` + (initialWidgetConfig
        ? `
In this particular instance of the chat, the user is modifying this widget:
\`\`\`
    ${JSON.stringify(initialWidgetConfig)}
\`\`\`

All your suggestions must revolve around how to modify or improve this widget.
Remember you are making suggestions as if you are the user. Each suggestion is a command to DataTalk`
        : "");
}

function shuffle<T>(array: T[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}
