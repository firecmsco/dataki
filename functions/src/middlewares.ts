import { NextFunction, Request, RequestHandler, Response } from "express";
import FireCMSException from "./types/exceptions";
import { ErrorReporting } from "@google-cloud/error-reporting";
import { verifyFirebaseToken } from "./services/auth";

const errors = new ErrorReporting();

export function errorMiddleware(error: Error, request: Request, response: Response, next: NextFunction) {
    if (error instanceof FireCMSException) {
        console.log("A FireCMSException happened");
        response.status(error.status).json({
            message: error.message,
            code: error.code,
            data: error.data ?? {}
        });
    } else {
        errors.report(error);
        console.log("An unknown error happened", error);
        console.error(error.stack);
        console.error(error.message);
        response.status(500).json({ "message": error.message ?? "Sever Internal Error" });
    }
}

export const firebaseAuthorization = (): RequestHandler => {
    return async (request: Request, response: Response, next: NextFunction) => {
        const decodedToken = await verifyFirebaseToken(request);
        if (decodedToken) {
            return next();
        }
    };
}
