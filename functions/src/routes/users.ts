import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { getUserCredentials } from "../services/users";
import { firestore } from "../firebase";
import { checkTokenHasScopes, cloudPlatformScope } from "../services/oauth";

// @ts-ignore
import etag from "etag";

const usersRouter = express.Router();

const corsOptions: CorsOptions = {
    origin: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204,
    allowedHeaders: ["Content-Type", "Authorization", "Allow", "Accept", "access-control-allow-origin"],
    methods: ["GET", "OPTIONS"],
    preflightContinue: false
}

usersRouter.options("/", cors(corsOptions), (request, response) => response.status(200));
usersRouter.get("/:uid/has_gcp_scopes", cors(corsOptions), hasGCPScopes);

/**
 * Has the user granted the required GCP scopes?
 */
async function hasGCPScopes(request: Request, response: Response) {

    const uid = request.params["uid"];

    const credentials = await getUserCredentials(firestore, uid);
    if (!credentials) {
        response.status(400).send({ error: "User has no credentials" });
        return;
    }

    const result = checkTokenHasScopes(credentials, [cloudPlatformScope]);

    response.status(200).send({ data: result });
}

export default usersRouter;

