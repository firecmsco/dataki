import dotenv from "dotenv";
import * as admin from "firebase-admin";

import { OAuth2Client } from "google-auth-library";
import { getUserAccessToken } from "../src/services/users";
import { runSQLQuery, runSQLQueryRest } from "../src/services/bigquery";
import { createServiceAccountLink, getStoredServiceAccount } from "../src/services/projects";
import { getProjectDataContext } from "../src/services/context_data";

dotenv.config();

// generateChartConfig("Show me the projects with most accesses in the last 7 days", "firecms-backend", "firestore_export")
//     .then((res) => runSQLQuery(res.sql))
//     // .then(console.log)
//     .catch(console.error);

// makeGeminiRequest({
//     userQuery: "What is the average price of products in the last 7 days?",
//     sources: [
//         {
//             projectId: "bigquery-public-data",
//             datasetId: "thelook_ecommerce",
//         }
//     ],
//     onDelta: (delta) => {
//         // console.log("Delta");
//         // console.log(delta);
//     },
//     history: []
// })
//     // .then((res) => runSQLQuery(res.sql))
//     .then(console.log)
//     .catch(console.error);

// read SA from file: datatalk-443fb-85b947e1fe8f.json
 const serviceAccount = require("../../../datatalk-443fb-85b947e1fe8f.json");


//
// getBigQueryDatasets("firecms-backend")
//     .then((datasets) => {
//         console.log("Datasets:", datasets);
//     })
//     .catch((err) => {
//         console.error("Error:", err);
//     });

// fetchAllDatasetsAndTablesMetadata("firecms-backend");

// refreshAccessToken("1//035Y7EyluA8nPCgYIARAAGAMSNwF-L9IrYurcFaTRbiKbv1_nq90rpSW6EWStAZfZIuF2pvMQQsFy3LHNg9xzRfKkUsmTrZWyJMk"
// ).then(console.log).catch(console.error);

export function initServiceAccountFirebase(prod = false) {

    // you may need to create this file from the cloud console
    console.log("Init script firestore");

    // @ts-ignore
    const serviceAccount = require("../../../datatalk-443fb-firebase-adminsdk-c2q4o-7658d1df0e.json");

    const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "firecms-dev-2da42.appspot.com"
    });

    const fs = admin.firestore();
    const settings = {
        timestampsInSnapshots: true,
        ignoreUndefinedProperties: true
    };
    fs.settings(settings);
    return app;
}

const app = initServiceAccountFirebase();
getUserAccessToken(app.firestore(), "OEX1VYwnyhVFWrF2UFUoYtkVyov1")
    .then(async (token) => {
        // const serviceAccountKey = await createServiceAccountLink(app.firestore(), token, "firecms-backend");
        const serviceAccountKey = await getStoredServiceAccount(app.firestore(), "firecms-backend");
        // console.log("Service account key", serviceAccountKey);
        // const projectDataContext = await getProjectDataContext(app.firestore(), "firecms-backend", "analytics_351154604");
        // console.log("Project data context", projectDataContext);
        console.log(serviceAccount);
        runSQLQuery("SELECT document_id, created_on FROM firecms-backend.firestore_export.users_latest ORDER BY created_on DESC LIMIT 100", serviceAccount);
        // runSQLQueryRest("SELECT document_id, created_on FROM firecms-backend.firestore_export.users_latest ORDER BY created_on DESC LIMIT 100", "firecms-backend", token);
        // console.log(accessToken)
        // runSQLQuery("SELECT  * FROM bigquery-public-data.thelook_ecommerce.inventory_items LIMIT 5", serviceAccountKey);
    });
