import { Router } from "express";
import { projectsRouter } from "./routes/projects";
import { dataTalkRouter } from "./routes/data_talk";

export const createRouter = (): Router => {
    const router = Router();
    router.use("/datatalk", dataTalkRouter);
    router.use("/projects", projectsRouter);
    return router;
}


