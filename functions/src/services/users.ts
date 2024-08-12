import { Credentials, User } from "../types/users";
import { GCPProject } from "../types/projects";

export async function listUserProjects(accessToken: string): Promise<GCPProject[]> {
    const API_URL = "https://cloudresourcemanager.googleapis.com/v1/projects";

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = (await response.json()).projects as GCPProject[];
        return data.filter(project => project.lifecycleState === "ACTIVE");

    } catch (error) {
        console.error("Error listing projects:", error);
        throw error;
    }

}

export function saveCredentialsToFirestore(firestore: FirebaseFirestore.Firestore, userId: string, credentials: Credentials) {
    console.log("Saving credentials to Firestore", credentials);
    return firestore.collection("users")
        .doc(userId)
        .set({
            credentials: credentials
        }, { merge: true });
}

export async function getUserCredentials(firestore: FirebaseFirestore.Firestore, userId: string): Promise<Credentials> {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("User not found: " + userId);
    }

    const userData = userDoc.data() as User;
    let credentials = userData.credentials;
    if (!credentials) {
        throw new Error("User has no credentials. This should not happen");
    }
    const expiry = new Date(credentials.expiry_date);
    console.log("Expiry date:", expiry);
    if (expiry < new Date()) {
        credentials = await refreshAccessToken(credentials.refresh_token);
        saveCredentialsToFirestore(firestore, userId, credentials).catch(console.error);
    }
    return credentials;
}

export async function getUserAccessToken(firestore: FirebaseFirestore.Firestore, userId: string) {
    const credentials = await getUserCredentials(firestore, userId);
    return credentials.access_token;
}

export async function refreshAccessToken(refreshToken: string) {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!client_id || !client_secret) {
        throw new Error("Client ID and Client Secret are required");
    }

    console.log("Refreshing access token", {
        client_id,
        client_secret,
        refreshToken
    });

    const postData = new URLSearchParams();
    postData.append("client_id", client_id);
    postData.append("client_secret", client_secret);
    postData.append("refresh_token", refreshToken);
    postData.append("grant_type", "refresh_token");

    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: postData.toString()
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error refreshing access token:", errorData);
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const expiry_date = new Date();
        expiry_date.setSeconds(expiry_date.getSeconds() + data.expires_in);
        data.expiry_date = expiry_date.getTime();
        delete data.expires_in;
        return data as Credentials;
    } catch (error) {
        console.error("Error refreshing token:" + error);
        throw error;
    }
}
