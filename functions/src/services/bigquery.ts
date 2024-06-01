import { BigQuery, BigQueryTimestamp } from "@google-cloud/bigquery";
// @ts-ignore
import { Big } from "big.js";

const bigquery = new BigQuery();

export async function runSQLQuery(sql: string) {
    const cleanSQL = sql.replaceAll("\\n", " ").replaceAll("\\\\n", " ").replaceAll("\n", " ").replace(/\n/g, "").replace(/\\\\/g, '');
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

