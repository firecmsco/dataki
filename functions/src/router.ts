import { Router } from "express";
import { projectsRouter } from "./routes/projects";
import { dataTalkRouter } from "./routes/data_talk";
import oauthRouter from "./routes/oauth";
import { dataRouter } from "./routes/sql";

export const createRouter = (): Router => {
    const router = Router();
    router.use("/datatalk", dataTalkRouter);
    router.use("/projects", projectsRouter);
    router.use("/oauth", oauthRouter);
    router.use("/data", dataRouter);
    return router;
}


