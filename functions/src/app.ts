import express from "express";
import "express-async-errors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { ErrorReporting } from "@google-cloud/error-reporting";
import { createCorsConfig } from "./cors";
import { errorMiddleware } from "./middlewares";
import { createRouter } from "./router";

export const buildExpressApp = () => {
    const app = express();
    app.use(createCorsConfig());
    app.use(morgan("tiny"));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(createRouter());
    app.use(new ErrorReporting().express)
    app.use(errorMiddleware);
    return app;
};
