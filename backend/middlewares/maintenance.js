import { pool } from "../database/postgresql.js";

export async function maintenanceMode(req, res, next) {
    const path = req.path || req.originalUrl || "";

    // Allow health checks, login/logout operations
    const openPaths = [
        "/api/health",
        "/api/auth/login",
        "/api/auth/google-login",
        "/api/auth/logout"
    ];

    if (openPaths.some(p => path.startsWith(p)) || path === "/health" || path === "/auth/login" || path === "/auth/google-login" || path === "/auth/logout") {
        return next();
    }

    try {
        const result = await pool.query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
        const isMaintenance = result.rows.length > 0 && result.rows[0].value === 'true';

        if (isMaintenance) {
            // Admins can bypass maintenance mode
            if (req.session && req.session.role === 'admin') {
                return next();
            }
            return res.status(503).json({ 
                error: "Site is temporarily down for maintenance. Please try again later.",
                maintenance: true 
            });
        }
    } catch (err) {
        console.error("Maintenance middleware error:", err);
    }

    next();
}
