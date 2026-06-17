import { pool } from "../database/postgresql.js";

export async function logSecurityEvent({ userId = null, eventType, email = null, ipAddress, userAgent, details = null }) {
    try {
        await pool.query(
            `INSERT INTO security_logs (user_id, event_type, email, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                userId,
                eventType,
                email,
                ipAddress || 'unknown',
                userAgent || 'unknown',
                details ? JSON.stringify(details) : null
            ]
        );
    } catch (err) {
        console.error("Failed to write security log:", err);
    }
}
