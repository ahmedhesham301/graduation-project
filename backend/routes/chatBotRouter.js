import { Router } from "express";
import { getRecommendation } from "../controllers/chatBotController.js";
import { validateMessage } from "../middlewares/validation/chatBotMessageValidator.js";

const router = Router();

router.post('/chatbot', validateMessage, getRecommendation)

export default router;