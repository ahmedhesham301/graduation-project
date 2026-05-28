import { Router } from "express";
import { isAuthenticated } from "../middlewares/session.js";
import { getInboxHandler, createMessageHandler, getConversationHandler } from "../controllers/chatController.js";

const router = Router();

router.get("/chat/inbox", isAuthenticated, getInboxHandler);
router.post("/chat/messages", isAuthenticated, createMessageHandler);
router.get("/chat/:propertyId/:userId1/:userId2", getConversationHandler);

export default router;
