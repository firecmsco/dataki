// @ts-ignore
import dotenv from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getUserAccessToken } from "../src/services/users";
import { runSQLQuery } from "../src/services/bigquery";
import { getStoredServiceAccount } from "../src/services/projects";
import { getFirestore } from "firebase-admin/firestore";

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
// const serviceAccount = require("../../../datatalk-443fb-85b947e1fe8f.json");

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

    const serviceAccount = require("../../../datatalk-443fb-firebase-adminsdk-c2q4o-7658d1df0e.json");

    const app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "firecms-dev-2da42.appspot.com"
    });

    const firestore = getFirestore(app);
    const settings = {
        timestampsInSnapshots: true,
        ignoreUndefinedProperties: true
    };
    firestore.settings(settings);
    return app;
}

const app = initServiceAccountFirebase();
getUserAccessToken(getFirestore(app), "OEX1VYwnyhVFWrF2UFUoYtkVyov1")
    .then(async (token) => {
        // const serviceAccountKey = await createServiceAccountLink(app.firestore(), token, "firecms-backend");
        const serviceAccountKey = await getStoredServiceAccount(getFirestore(app), "firecms-backend");
        // console.log("Service account key", serviceAccountKey);
        // const projectDataContext = await getProjectDataContext(app.firestore(), "firecms-backend", "analytics_351154604");
        // console.log("Project data context", projectDataContext);
        runSQLQuery(
            "WITH\n" +
            "  DateSeries AS (\n" +
            "    SELECT\n" +
            "      generate_timestamp_array(\n" +
            "        TIMESTAMP(@DATE_START), \n" +
            "        TIMESTAMP(@DATE_END), \n" +
            "        INTERVAL 1 DAY\n" +
            "      ) AS date_array\n" +
            "  ),\n" +
            "  ExplodedDates AS (\n" +
            "    SELECT\n" +
            "      DATE(date) AS date\n" +
            "    FROM\n" +
            "      DateSeries,\n" +
            "      UNNEST(DateSeries.date_array) AS date\n" +
            "  ),\n" +
            "  UserRegistrations AS (\n" +
            "    SELECT\n" +
            "      DATE(created_on) AS creation_date,\n" +
            "      COUNT(DISTINCT document_id) AS new_users\n" +
            "    FROM\n" +
            "      `firecms-backend.firestore_export.users_latest`\n" +
            "    WHERE\n" +
            "      DATE(created_on) BETWEEN DATE(@DATE_START) AND DATE(@DATE_END)\n" +
            "    GROUP BY\n" +
            "      creation_date\n" +
            "  )\n" +
            "SELECT\n" +
            "  ed.date,\n" +
            "  COALESCE(ur.new_users, 0) AS new_users\n" +
            "FROM\n" +
            "  ExplodedDates AS ed\n" +
            "  LEFT JOIN UserRegistrations AS ur ON ed.date = ur.creation_date\n" +
            "ORDER BY\n" +
            "  ed.date;",
            serviceAccountKey,
            {});
        // runSQLQueryRest("SELECT document_id, created_on FROM firecms-backend.firestore_export.users_latest ORDER BY created_on DESC LIMIT 100", "firecms-backend", token);
        // console.log(accessToken)
        // runSQLQuery("SELECT  * FROM bigquery-public-data.thelook_ecommerce.inventory_items LIMIT 5", serviceAccountKey);
    });
