import axios from "axios";
import DatakiException from "../types/exceptions";
import { IAMPolicy, ServiceAccountInfo, ServiceAccountKey } from "../types/service_account";

const SA_ACCOUNT_ID = "datatalk";

function buildServiceAccountEmail(projectId: string): string {
    return `${SA_ACCOUNT_ID}@${projectId}.iam.gserviceaccount.com`;
}

const NECESSARY_ROLES = [
    "roles/bigquery.jobUser",
    "roles/bigquery.dataViewer",
    "roles/iam.serviceAccountTokenCreator"
];

export const createServiceAccount = async (accessToken: string, projectId: string): Promise<ServiceAccountInfo> => {
    try {
        const response = await axios.post(`https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`, {
            "accountId": SA_ACCOUNT_ID,
            "serviceAccount": {
                "description": "Account in charge of performing backend operations related to DataTalk",
                "displayName": "DataTalk"
            }
        }, { headers: { "Authorization": `Bearer ${accessToken}` } });
        if (response.status < 300) {
            return response.data;
        } else {
            throw new DatakiException(response.status, response.data);
        }
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            console.log("Service account already exists");
            return getServiceAccount(accessToken, projectId);
        }
        if (axios.isAxiosError(error)) {
            console.error(error.response?.data);
            throw new DatakiException(error.response?.status ?? 500, error.message);
        }
        throw new DatakiException(500, "Error creating service account");
    }
}

export const getServiceAccount = async (accessToken: string, projectId: string): Promise<ServiceAccountInfo> => {
    console.log("Getting service account", projectId);

    const saEmail = buildServiceAccountEmail(projectId);

    try {
        const response = await axios.get(
            `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${saEmail}`,
            {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });
        if (response.status < 300)
            return response.data;
        else {
            throw new DatakiException(response.status, response.data);
        }
    } catch (error) {
        if (error instanceof Error)
            console.error(error.message);

        if (axios.isAxiosError(error))
            throw new DatakiException(error.response?.status ?? 500, error.message);

        throw new DatakiException(500, "Error getting service account");
    }
}

export const createServiceAccountKey = async (accessToken: string, projectId: string, serviceAccountEmail: string): Promise<ServiceAccountKey> => {
    try {
        const response = await axios.post(`https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${serviceAccountEmail}/keys`, {}, { headers: { "Authorization": `Bearer ${accessToken}` } });
        const privateKeyBase64 = response.data.privateKeyData;
        return JSON.parse(Buffer.from(privateKeyBase64, "base64").toString());
    } catch (error: any) {
        console.error("Error creating service account key");

        if (axios.isAxiosError(error))
            throw new DatakiException(error.response?.status ?? 500, error.message);

        throw new DatakiException(500, "Error creating service account key");
    }
}

export const grantRolesToServiceAccount = async (accessToken: string, projectId: string, serviceAccount: ServiceAccountKey) => {
    console.log("Granting roles to service account", serviceAccount.client_email);
    const iamPolicy = await getIAMPolicy(accessToken, projectId);
    console.log("IAM policy retrieved", iamPolicy);
    for (const neededRole of NECESSARY_ROLES)
        addRoleForServiceAccount(neededRole, serviceAccount.client_email, iamPolicy);
    await updateIAMPolicy(accessToken, projectId, iamPolicy);
    console.log("Roles granted to service account", serviceAccount.client_email);
}

const addRoleForServiceAccount = (role: string, serviceAccountEmail: string, policy: IAMPolicy) => {
    const roleIndex = policy.bindings.findIndex(binding => binding.role === role);
    if (roleIndex > -1) {
        if (!policy.bindings[roleIndex].members.includes(`serviceAccount:${serviceAccountEmail}`))
            policy.bindings[roleIndex].members.push(`serviceAccount:${serviceAccountEmail}`);
    } else {
        policy.bindings.push({
            role,
            members: [`serviceAccount:${serviceAccountEmail}`]
        });
    }
}

export const getIAMPolicy = async (accessToken: string, projectId: string): Promise<IAMPolicy> => {
    try {
        const response = await axios.post(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`, {
            "options": {
                "requestedPolicyVersion": 3
            }
        }, { headers: { "Authorization": `Bearer ${accessToken}` } });
        if (response.status < 300)
            return response.data;
        else
            throw new DatakiException(response.status, "Error getting IAM policy");
    } catch (error: any) {
        if (axios.isAxiosError(error))
            throw new DatakiException(error.response?.status ?? 500, error.message);

        throw new DatakiException(500, "Error getting IAM policy");

    }

}

export const updateIAMPolicy = async (accessToken: string, projectId: string, policy: IAMPolicy): Promise<IAMPolicy> => {
    console.log("Updating IAM policy", policy);
    try {
        const response = await axios.post(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:setIamPolicy`, {
            "policy": policy
        }, { headers: { "Authorization": `Bearer ${accessToken}` } });
        if (response.status < 300) {
            return response.data;
        } else {
            console.error("Error updateIAMPolicy", response.data);
            throw new DatakiException(response.status, "Error updating IAM policy");
        }
    } catch (error: any) {
        console.error("Error updateIAMPolicy", error.response?.data);

        if (axios.isAxiosError(error))
            throw new DatakiException(error.response?.status ?? 500, error.message);

        throw new DatakiException(500, "Error updating IAM policy");
    }
}
