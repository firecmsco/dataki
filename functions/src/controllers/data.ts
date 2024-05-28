import { Request, Response } from "express";
import FireCMSException from "../types/exceptions";
import { ChartConfigItem } from "../types/items";
import { runSQLQuery } from "../services/bigquery";
import { mapDataToJSON } from "../services/data";

export const enrichChartOrTable = async (request: Request, response: Response) => {
    if (!request.body.config) {
        throw new FireCMSException(400, "Missing config param in the body", "Invalid request");
    }

    const config: ChartConfigItem = request.body.config;

    if (!config.sql) {
        throw new FireCMSException(400, "Missing sql in the config", "Invalid request");
    }

    const data = await runSQLQuery(config.sql);
    const res = mapDataToJSON(config, data);

    response.json({ data: { ...res, data } });
}
