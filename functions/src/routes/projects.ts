import express, { Request, Response } from "express";
import { firebaseAuthorization } from "../middlewares";
import { getBigQueryDatasets } from "../services/bigquery";
import { getUserAccessToken, listUserProjects } from "../services/users";
import { firestore } from "../firebase";
import { createServiceAccountLink, deleteServiceAccountLink } from "../services/projects";

export const projectsRouter = express.Router();

projectsRouter.get("/:projectId/datasets", firebaseAuthorization(), getDatasetsRoute);
projectsRouter.post("/:projectId/service_accounts", firebaseAuthorization(), createServiceAccountRoute);
projectsRouter.delete("/:projectId/service_accounts", firebaseAuthorization(), deleteServiceAccountRoute);
projectsRouter.get("/", firebaseAuthorization(), getUserGCPProjectsRoute);

async function getDatasetsRoute(request: Request, response: Response) {
    const projectId: string = request.params.projectId;
    const uid = request.firebaseTokenInfo?.uid;
    if (!uid) {
        throw new Error("User not found");
    }
    const accessToken = await getUserAccessToken(firestore, uid);
    if (!accessToken) {
        throw new Error("Admin token not found");
    }
    const data = await getBigQueryDatasets(projectId, accessToken);
    response.json({ data: data });
}

async function getUserGCPProjectsRoute(request: Request, response: Response) {
    const uid = request.firebaseTokenInfo?.uid;
    if (!uid) {
        throw new Error("User not found");
    }
    const accessToken = await getUserAccessToken(firestore, uid);
    if (!accessToken) {
        throw new Error("Admin token not found");
    }
    const data = await listUserProjects(accessToken);
    const projectsWithServiceAccounts = await Promise.all(data.map(async (project) => {
            const projectDoc = await firestore.collection("projects").doc(project.projectId).get();
            return {
                ...project,
                linked: Boolean(projectDoc.get("serviceAccount"))
            };
        }
    ));
    response.json({ data: projectsWithServiceAccounts });
}

async function createServiceAccountRoute(request: Request, response: Response) {
    const projectId: string = request.params.projectId;
    const uid = request.firebaseTokenInfo?.uid;
    if (!uid) {
        throw new Error("User not found");
    }
    if (!projectId) {
        throw new Error("Project ID not found");
    }
    const accessToken = await getUserAccessToken(firestore, uid);
    if (!accessToken) {
        throw new Error("Admin token not found");
    }
    const data = await createServiceAccountLink(firestore, accessToken, projectId);
    response.json({ data: Boolean(data) });
}


async function deleteServiceAccountRoute(request: Request, response: Response) {
    const projectId: string = request.params.projectId;
    const uid = request.firebaseTokenInfo?.uid;
    if (!uid) {
        throw new Error("User not found");
    }
    if (!projectId) {
        throw new Error("Project ID not found");
    }
    // TODO: check user has permission over this project
    const data = await deleteServiceAccountLink(firestore, projectId);

    response.json({ data: Boolean(data) });
}

