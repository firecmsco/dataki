import { Request } from "express";
import { GoogleAuth } from "google-auth-library";
import { firebaseTokenInvalid, firebaseTokenMissing, tokenExpired } from "../models/errors";
import { firebaseAuth } from "../firebase";
import { DecodedToken } from "../models/auth";
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


export const getGoogleProjectId = async (): Promise<string> => {
  const googleAuth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform"
  });
  const { credential } = await googleAuth.getApplicationDefault();
  if (credential.projectId) {
    return credential.projectId;
  }
  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }
  throw new Error("Failed to get project id");
}
