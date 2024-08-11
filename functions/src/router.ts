import { Router } from "express";
import { projectsRouter } from "./routes/projects";
import { datakiRouter } from "./routes/dataki";
import oauthRouter from "./routes/oauth";
import { dataRouter } from "./routes/sql";
import notificationsRouter from "./routes/notifications";

export const createRouter = (): Router => {
    const router = Router();
    router.use("/dataki", datakiRouter);
    router.use("/projects", projectsRouter);
    router.use("/oauth", oauthRouter);
    router.use("/data", dataRouter);
    router.use("/notifications", notificationsRouter);
    return router;
}


