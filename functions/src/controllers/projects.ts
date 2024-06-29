import { Request, Response } from "express";
import { fetchAllDatasetsAndTablesMetadata } from "../services/bigquery";

export const getDatasets = async (request: Request, response: Response) => {
    const projectId: string = request.params.projectId;
    const data = await fetchAllDatasetsAndTablesMetadata(projectId);
    response.json({ data: data });
}

