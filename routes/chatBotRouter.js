import { Router } from "express";
import { getRecommendation } from "../controllers/chatBotController.js";

const router = Router();

router.post('/chatbot', getRecommendation)

export default router;