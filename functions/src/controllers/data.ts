import { Request, Response } from "express";
import FireCMSException from "../types/exceptions";
import { DryWidgetConfig } from "../types/items";
import { runSQLQuery } from "../services/bigquery";
import { hydrateWidgetConfig } from "../services/hydration";

export const hydrateChartOrTable = async (request: Request, response: Response) => {
    if (!request.body.config) {
        throw new FireCMSException(400, "Missing config param in the body", "Invalid request");
    }

    const config: DryWidgetConfig = request.body.config;

    if (!config.sql) {
        throw new FireCMSException(400, "Missing sql in the config", "Invalid request");
    }

    const data = await runSQLQuery(config.sql);
    const res = hydrateWidgetConfig(config, data);

    response.json({ data: res });
}
