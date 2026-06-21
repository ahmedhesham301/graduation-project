import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "../models/notificationModel.js";

export async function getNotificationsHandler(req, res) {
    try {
        const notifications = await getNotifications(req.session.userID);
        const unreadCount = await getUnreadCount(req.session.userID);
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getUnreadCountHandler(req, res) {
    try {
        const unreadCount = await getUnreadCount(req.session.userID);
        res.json({ unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function markReadHandler(req, res) {
    try {
        await markAsRead(req.session.userID, req.params.id);
        res.json({ message: "marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function markAllReadHandler(req, res) {
    try {
        await markAllAsRead(req.session.userID);
        res.json({ message: "all marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}
