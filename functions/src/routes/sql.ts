import express, { Request, Response } from "express";
import { firebaseAuthorization } from "../middlewares";
import DatakiException from "../types/exceptions";
import { DateParams } from "../types/dashboards";
import { runSQLQuery } from "../services/bigquery";
import { getStoredServiceAccount } from "../services/projects";
import { firestore } from "../firebase";
import { Filter, OrderBy } from "../types/sql";

// @ts-ignore
import etag from "etag";

export const dataRouter = express.Router();

dataRouter.post("/query", firebaseAuthorization(), sqlRequestRoute);

async function sqlRequestRoute(request: Request, response: Response) {

    const sql: string | undefined = request.body.sql;
    const projectId: string | undefined = request.body.projectId;

    if (!sql) {
        throw new DatakiException(400, "Missing sql in the body", "Invalid request");
    }
    if (!projectId) {
        throw new DatakiException(400, "Missing projectId in the body", "Invalid request");
    }
    const params: DateParams | undefined = request.body.params;
    const orderBy: OrderBy | undefined = request.body.orderBy;
    const filter: Filter | undefined = request.body.filter;
    const limit: number | undefined = request.body.limit;
    const offset: number | undefined = request.body.offset;

    const credentials = await getStoredServiceAccount(firestore, projectId);

    const data = await runSQLQuery({
        sql,
        credentials,
        params,
        orderBy,
        filter,
        limit,
        offset
    });

    response.setHeader("ETag", etag(JSON.stringify(data)));
    response.json({ data: data });
}
