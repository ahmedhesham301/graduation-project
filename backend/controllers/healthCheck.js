import { pool } from "../database/postgresql.js";

export async function healthCheck(req, res) {
    try {
        const result = await pool.query("SELECT key, value FROM site_settings WHERE key IN ('maintenance_mode', 'allow_new_registrations')");
        const settings = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }
        res.status(200).json({ 
            status: "ok", 
            maintenance: settings.maintenance_mode === 'true',
            allowRegistrations: settings.allow_new_registrations !== 'false'
        });
    } catch (err) {
        console.error("Health check error:", err);
        res.status(200).json({ status: "degraded", maintenance: false, allowRegistrations: true });
    }
}