
import dotenv from "dotenv";

dotenv.config();
import { makeGeminiRequest } from "./gemini";
console.log("Running test");
// generateChartConfig("Show me the projects with most accesses in the last 7 days", "firecms-backend", "firestore_export")
//     .then((res) => runSQLQuery(res.sql))
//     // .then(console.log)
//     .catch(console.error);
makeGeminiRequest({
    userQuery: "What is the average price of products in the last 7 days?",
    projectId: "bigquery-public-data",
    datasetId: "thelook_ecommerce",
    onDelta: (delta) => {
        // console.log("Delta");
        // console.log(delta);
    },
    history: []
})
    // .then((res) => runSQLQuery(res.sql))
    .then(console.log)
    .catch(console.error);
