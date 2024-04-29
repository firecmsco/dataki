import { Router } from "express";
import dataTalk from "./routes/data_talk";

export const createRouter = (): Router => {
    const router = Router();
    router.use("/datatalk", dataTalk);
    return router;
}


