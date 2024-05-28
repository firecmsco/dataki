import { makeGeminiRequest } from "./command";

console.log("Running test");
// generateChartConfig("Show me the projects with most accesses in the last 7 days", "firecms-backend", "firestore_export")
//     .then((res) => runSQLQuery(res.sql))
//     // .then(console.log)
//     .catch(console.error);
makeGeminiRequest({
    userQuery: "Show me 10 orders with most items",
    projectId: "bigquery-public-data",
    datasetId: "thelook_ecommerce",
    onDelta: (delta) => {
        // console.log("Delta");
        console.log(delta);
    },
    history: []
})
    // .then((res) => runSQLQuery(res.sql))
    .then(console.log)
    .catch(console.error);
