import { pool } from "../database/postgresql.js";

export async function createNotification(userId, type, title, message, propertyId, senderId) {
    const query = {
        text: `INSERT INTO notifications (user_id, type, title, message, property_id, sender_id)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [userId, type, title, message, propertyId, senderId]
    };
    const { rows } = await pool.query(query);
    return rows[0];
}

export async function getNotifications(userId, limit = 20) {
    const query = {
        text: `SELECT n.*, u.full_name AS sender_name
               FROM notifications n
               LEFT JOIN users u ON u.id = n.sender_id
               WHERE n.user_id = $1
               ORDER BY n.created_at DESC
               LIMIT $2`,
        values: [userId, limit]
    };
    const { rows } = await pool.query(query);
    return rows;
}

export async function getUnreadCount(userId) {
    const query = {
        text: `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        values: [userId]
    };
    const { rows } = await pool.query(query);
    return rows[0].count;
}

export async function markAsRead(userId, notificationId) {
    const query = {
        text: `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
        values: [notificationId, userId]
    };
    const { rowCount } = await pool.query(query);
    return rowCount > 0;
}

export async function markAllAsRead(userId) {
    const query = {
        text: `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        values: [userId]
    };
    const { rowCount } = await pool.query(query);
    return rowCount;
}
