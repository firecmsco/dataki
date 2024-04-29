import axios from "axios";
import { userNotAuthorizedToPerformAction } from "../models/errors";
import { getTokenFromServiceAccountInContext } from "./auth";
import { DataContext } from "../models/command";
import { firestore } from "../firebase";


interface FirestoreDatabases {
    "name": string,
    "locationId": string,
    "type": string,
    "concurrencyMode": string,
    "appEngineIntegrationMode": string,
    "keyPrefix": string,
    "etag": string
}

export const getDatabases = async (accessToken: string, projectId: string): Promise<FirestoreDatabases[] | null> => {
    try {
        const response = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases`, { headers: { "Authorization": `Bearer ${accessToken}` } });
        return response.data.databases ?? [];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Got error in getDatabases ${projectId}`);
            console.error(error.response?.data);
        }
        return null;
    }
}

export const getRootCollectionsIds = async (accessToken: string, parent: string): Promise<Array<string>> => {
    try {
        const response = await axios.post(`https://firestore.googleapis.com/v1/${parent}/documents/:listCollectionIds`, {}, { headers: { "Authorization": `Bearer ${accessToken}` } });
        if (Array.isArray(response.data.collectionIds))
            return response.data.collectionIds;
        return [];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(error.response?.data);
            if (error.response?.data.error.code === 403) {
                throw userNotAuthorizedToPerformAction;
            }
        }
        throw error;
    }
}

export const getRootCollections = async (accessToken: string, projectId: string) => {
    const databases = await getDatabases(accessToken, projectId);
    const firestoreDatabases = databases?.filter(item => item.type === "FIRESTORE_NATIVE");
    if (!firestoreDatabases || firestoreDatabases.length < 1) {
        // when the project is just created, the database might be empty
        return [];
    }
    const collectionIds = await getRootCollectionsIds(accessToken, firestoreDatabases[0].name) ?? [];
    return collectionIds.filter((name: string) => !["**", "*", "__FIRECMS"].includes(name));
}

const getSampleDataFromCollection = async (delegatedFirestore: FirebaseFirestore.Firestore, collectionName: string): Promise<{
    data: object[],
    collection: string
}> => {
    const collectionRef = delegatedFirestore.collection(collectionName);
    const snapshot = await collectionRef.limit(4).get();
    const data = snapshot.docs.map(doc => doc.data());
    return {
        data,
        collection: collectionName
    };
}

export const getDataContextFromServiceAccount = async (projectId: string): Promise<DataContext> => {
    const accessToken = await getTokenFromServiceAccountInContext();
    if(!accessToken) {
        throw new Error("Failed to get access token");
    }
    const rootCollections = await getRootCollections(accessToken, projectId);
    console.log(`Got root collections: ${rootCollections?.join(", ")}`);
    return await Promise.all(rootCollections.map((collectionName: string) => getSampleDataFromCollection(firestore, collectionName)));
}

