import { Firestore } from "firebase-admin/firestore";
import { createServiceAccount, createServiceAccountKey, grantRolesToServiceAccount } from "./gcp_project";
import { decrypt, encrypt } from "./kms";
import { ServiceAccountKey } from "../types/service_account";

export async function createServiceAccountLink(firestore: Firestore, accessToken: string, projectId: string,): Promise<ServiceAccountKey> {

    // create a service account
    const serviceAccount = await createServiceAccount(accessToken, projectId);

    // create service account key
    const serviceAccountKey = await createServiceAccountKey(accessToken, projectId, serviceAccount.email);

    // grant roles
    await grantRolesToServiceAccount(accessToken, projectId, serviceAccountKey);

    // encrypt the service account key
    const encryptedServiceAccount = await encrypt(serviceAccountKey);

    // save the encrypted service account key to Firestore
    await firestore.collection("projects").doc(projectId).set({
        serviceAccount: encryptedServiceAccount
    });

    return serviceAccountKey;

}

export async function deleteServiceAccountLink(firestore: Firestore, projectId: string,) {
    await firestore.collection("projects").doc(projectId).set({
        serviceAccount: null
    });
}

export async function getStoredServiceAccount(firestore: Firestore, projectId: string): Promise<ServiceAccountKey | undefined> {
    const project = await firestore.collection("projects").doc(projectId).get();
    if (!project.exists) {
        return undefined;
    }

    const data = project.data();
    if (!data?.serviceAccount) {
        return undefined;
    }

    return decrypt(data.serviceAccount);
}
