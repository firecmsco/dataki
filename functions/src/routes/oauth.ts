import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import axios, { AxiosResponse } from "axios";
import { firebaseAuthorization } from "../middlewares";
import { saveCredentialsToFirestore } from "../services/users";
import { Credentials } from "google-auth-library";
import { firestore } from "../firebase";
import { getAuthUrl, getOauthTokenFromCode, refreshOauthCredentials } from "../services/oauth";

// @ts-ignore
import etag from "etag";

const oauthRouter = express.Router();

const corsOptions: CorsOptions = {
    origin: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204,
    allowedHeaders: ["Content-Type", "Authorization", "Allow", "Accept", "access-control-allow-origin"],
    methods: ["GET", "OPTIONS"],
    preflightContinue: false
}

oauthRouter.options("/", cors(corsOptions), (request, response) => response.status(200));
oauthRouter.post("/credentials", cors(corsOptions), firebaseAuthorization(), saveUserCredentials);
oauthRouter.get("/generate_auth_url", cors(corsOptions), generateAuthUrl);
oauthRouter.get("/exchange_code_for_token", cors(corsOptions), exchangeCodeForToken);
oauthRouter.post("/refresh_access_token", cors(corsOptions), refreshAccessToken);

// save credentials in body to user col
async function saveUserCredentials(request: Request, response: Response) {

    const credentials = request.body;

    if (!credentials) {
        response.status(400).send({ error: "param credentials is required" });
        return;
    }

    const uid = request.firebaseTokenInfo?.uid;
    if (!uid) {
        response.status(400).send({ error: "param uid is required" });
        return;
    }
    await saveCredentialsToFirestore(firestore, uid, credentials);
    response.status(200).send({ data: "Credentials saved successfully" });
}

/**
 * Generates the authorization URL for the OAuth2 flow
 */
function generateAuthUrl(request: Request, response: Response) {

    const redirect_uri = request.query["redirect_uri"];
    if (!redirect_uri) {
        response.status(400).send({ error: "param redirect_uri is required" });
        return;
    }
    const authorizationUrl = getAuthUrl(redirect_uri as string);

    response.setHeader("ETag", etag(authorizationUrl))
    response.status(200).send({ data: authorizationUrl });
}

function exchangeCodeForToken(request: Request, response: Response) {

    const redirect_uri = request.query["redirect_uri"];
    if (!redirect_uri) {
        response.status(400).send({ error: "param redirect_uri is required" });
        return
    }

    const code = request.query["code"];
    if (!code) {
        response.status(400).send({ error: "param code is required" });
        return;
    }

    getOauthTokenFromCode(code as string, redirect_uri as string)
        .then((tokens: Credentials) => {
            response.status(200).send({ data: tokens });
        })
        .catch((error: any) => {
            console.error(error);
            response.status(500).send({
                error: "Error retrieving access token",
                message: error.message
            });
        });

}

export function refreshAccessToken(request: Request, response: Response) {
    const credentials = request.body;
    refreshOauthCredentials(credentials)
        .then((res: Credentials) => {
            response.status(200).send({ data: res });
        })
        .catch((error: any) => {
            console.error(error);
            response.status(500).send({
                error: "Error refreshing access token",
                message: error.message
            });
        });

}

export default oauthRouter;

