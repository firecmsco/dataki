import { BigQuery, BigQueryTimestamp } from "@google-cloud/bigquery";
// @ts-ignore
import { Big } from "big.js";
import { DatasetConfig } from "../types/dataset";

const bigquery = new BigQuery();

export async function runSQLQuery(sql: string) {
    const cleanSQL = sql.replaceAll("\\n", " ").replaceAll("\\\\n", " ").replaceAll("\n", " ").replaceAll("\\'", "'").replace(/\n/g, "").replace(/\\\\/g, "");
    console.log(`Running query: ${sql}`);
    console.log(`Running clean query: ${cleanSQL}`);
    const options = {
        query: cleanSQL,
        parseJson: true
    };
    const [rows] = await bigquery.query(options);
    console.log(`Total rows: ${rows.length}`);
    // return rows;
    const result = rows.map(convertBQValues);
    console.log(result);
    return result;
}

function convertBQValues(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Big) {
        return obj.toNumber();
    }

    if (obj instanceof BigQueryTimestamp) {
        return new Date(obj.value);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => convertBQValues(item));
    }

    if (typeof obj === "object") {
        const convertedObj: { [key: string]: any } = {};
        for (const key in obj) {
            // eslint-disable-next-line no-prototype-builtins
            if (obj.hasOwnProperty(key)) {
                convertedObj[key] = convertBQValues(obj[key]);
            }
        }
        return convertedObj;
    }

    return obj;
}

export async function fetchAllDatasetsAndTablesMetadata(projectId: string): Promise<any[]> {
    const bigquery = new BigQuery({ projectId });

    try {
        // Get the list of datasets in the project
        const [datasets] = await bigquery.getDatasets();
        // Fetch metadata for each dataset and its tables
        // const datasetsMetadata = await Promise.all(
        //     datasets.map(async (dataset) => {
        //         const datasetId = dataset.id;
        //         if (!datasetId) throw new Error("Dataset ID not found");
        //         const [tables] = await dataset.getTables();
        //
        //         const tablesMetadata = await Promise.all(
        //             tables.map(async (table) => {
        //                 const [metadata] = await table.getMetadata();
        //                 return {
        //                     tableId: table.id as string,
        //                     metadata
        //                 };
        //             })
        //         );
        //
        //         return {
        //             datasetId,
        //             tables: tablesMetadata
        //         };
        //     })
        // );

        console.log("datasets", datasets)
        return datasets.map(set => ({
            id: set.id
        }));
    } catch (error) {
        console.error("Error fetching datasets and tables metadata:", error);
        throw error;
    }
}
