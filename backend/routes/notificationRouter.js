import { Router } from "express";
import { isAuthenticated } from "../middlewares/session.js";
import {
    getNotificationsHandler,
    getUnreadCountHandler,
    markReadHandler,
    markAllReadHandler
} from "../controllers/notificationController.js";

const router = Router();

router.get("/notifications", isAuthenticated, getNotificationsHandler);
router.get("/notifications/unread-count", isAuthenticated, getUnreadCountHandler);
router.put("/notifications/:id/read", isAuthenticated, markReadHandler);
router.put("/notifications/read-all", isAuthenticated, markAllReadHandler);

export default router;
