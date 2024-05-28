import express from "express";
import { processUserCommand } from "../controllers/commands";
import { firebaseAuthorization } from "../middlewares";
import { check } from "../controllers/health";
import { enrichChartOrTable } from "../controllers/data";


const router = express.Router();

router.get("/health", check());
router.post("/command", firebaseAuthorization(), processUserCommand);
router.post("/enrich", firebaseAuthorization(), enrichChartOrTable);

export default router;
