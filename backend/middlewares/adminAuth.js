import { logSecurityEvent } from "../services/auditLogger.js";

export async function isAdmin(req, res, next) {
    if (req.session.role !== 'admin') {
        await logSecurityEvent({
            userId: req.session.userID || null,
            eventType: "unauthorized_admin_access",
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            details: { path: req.originalUrl || req.path }
        });
        return res.status(403).json({ error: "Admin access required" })
    }
    next()
}
