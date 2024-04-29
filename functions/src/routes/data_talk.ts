import express from "express";
import { command } from "../controllers/data_talk";
import { firebaseAuthorization } from "../middlewares";
import { check } from "../controllers/health";


const router = express.Router();

router.get("/health", check());
router.post("/command", firebaseAuthorization(), command());

export default router;
