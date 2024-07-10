import { Router } from "express";
import { projectsRouter } from "./routes/projects";
import { dataTalkRouter } from "./routes/data_talk";
import oauthRouter from "./routes/oauth";

export const createRouter = (): Router => {
    const router = Router();
    router.use("/datatalk", dataTalkRouter);
    router.use("/projects", projectsRouter);
    router.use("/oauth", oauthRouter);
    return router;
}


