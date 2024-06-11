import express from "express";
import { processUserCommand } from "../controllers/commands";
import { firebaseAuthorization } from "../middlewares";
import { check } from "../controllers/health";
import { hydrateChartOrTable } from "../controllers/data";
import { getDatasets } from "../controllers/projects";

export const projectsRouter = express.Router();

projectsRouter.get("/:projectId/datasets", firebaseAuthorization(), getDatasets);

