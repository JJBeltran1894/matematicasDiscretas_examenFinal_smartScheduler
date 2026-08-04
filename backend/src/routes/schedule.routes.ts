import { Router } from "express";
import { generateSchedules } from "../controllers/schedule.controller.ts";

const router = Router();

// POST /api/schedules/generate
router.post("/generate", generateSchedules);

export default router;
