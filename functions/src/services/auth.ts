import { Request } from "express";
import { GoogleAuth } from "google-auth-library";
import { firebaseTokenInvalid, firebaseTokenMissing, tokenExpired } from "../models/errors";
import { firebaseAuth } from "../firebase";
import { DecodedToken, ServiceAccount } from "../models/auth";
import { FirebaseError } from "firebase-admin"

const isFirebaseError = (error: unknown): error is FirebaseError => {
  return error instanceof Error && "code" in error;
}

export const verifyFirebaseToken = async (request: Request) => {
  try {
    let accessToken: string | undefined = request.query.access_token as string;
    if (!accessToken) {
      const authorizationHeader = request.headers["authorization"];
      if (!authorizationHeader) {
        throw firebaseTokenMissing;
      }
      const bearerParts = authorizationHeader.split(" ");
      accessToken = bearerParts[1];
    }
    const verifiedToken: DecodedToken = await firebaseAuth.verifyIdToken(accessToken);
    if (!verifiedToken || !verifiedToken.uid)
      throw tokenExpired;
    const expiryDate = new Date(verifiedToken.exp * 1000);
    if (expiryDate < new Date())
      throw tokenExpired;
    request.firebaseTokenInfo = verifiedToken;
    return verifiedToken;
  } catch (error) {
    console.error("Error verifying firebase token", error);
    if (isFirebaseError(error) && (error.code === "invalid_token" || error.code === "auth/argument-error"))
      throw firebaseTokenInvalid;
    else if (isFirebaseError(error) && error.code === "auth/id-token-expired")
      throw tokenExpired;
    else {
      console.error(error);
      throw error;
    }
  }
}

export const getServiceAccount = async (): Promise<ServiceAccount | undefined> => {
  console.log("Getting service account");
  // Read from env
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount) {
    console.error("Service account not found in env");
    return;
  }
   return JSON.parse(serviceAccount);
}


export const getGoogleProjectId = async (): Promise<string> => {
  const googleAuth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const {credential} = await googleAuth.getApplicationDefault();
  if (!credential.projectId) {
    throw new Error("Failed to get project id");
  }
  return credential.projectId;
}


export const getTokenFromServiceAccountInContext = async(): Promise<string> =>{
  const googleAuth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const {credential} = await googleAuth.getApplicationDefault();
  const accessToken = await credential.getAccessToken();
  if(!accessToken || !accessToken.token) throw new Error("Failed to get access token");
  return accessToken.token;
}
