import { ServiceAccount } from "../models/auth";
import { DataContext } from "../models/command";
import { getDataContextFromServiceAccount } from "./data_context";
import { getGoogleProjectId } from "./auth";

const projectContextDataCache: Record<string, DataContext> = {};

export const getProjectContextData = async (): Promise<DataContext> => {
    const projectId = await getGoogleProjectId();
    if (projectContextDataCache[projectId]) {
        console.log("CACHE HIT: Returning cached data for project", projectId);
        // refresh data async
        getDataContextFromServiceAccount(projectId)
            .then((data) => projectContextDataCache[projectId] = data);
        return projectContextDataCache[projectId];
    }
    console.log("CACHE MISS: Fetching data for project", projectId);
    const projectContextData = await getDataContextFromServiceAccount(projectId);
    projectContextDataCache[projectId] = projectContextData;
    return projectContextData;
}
