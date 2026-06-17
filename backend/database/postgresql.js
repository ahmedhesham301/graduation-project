import { Pool } from "pg"
import fs from "fs";
let poolConfig = {
    user: process.env.PGUSER || 'postgres',
    password: String(process.env.PGPASSWORD || '1234'),
    database: process.env.PGDATABASE || 'postgres',
    host: process.env.PGHOST || '127.0.0.1',
}
if (process.env.ENV === "prod") {
    poolConfig = {
        ...poolConfig,
        ssl: { rejectUnauthorized: false, ca: fs.readFileSync('./database/global-bundle.pem').toString() }
    }
}
export const pool = new Pool(poolConfig)

export async function initDB() {
    try {
        if (!process.env.PGPASSWORD) {
            console.warn("WARNING: PGPASSWORD is not set in environment variables!");
        }
        await pool.query("SELECT now()")
        
        // Self-migrating database additions for Account Lockout
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP DEFAULT NULL;
        `);

        // Self-migrating table for Security Audits
        await pool.query(`
            CREATE TABLE IF NOT EXISTS security_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                event_type VARCHAR(50) NOT NULL,
                email VARCHAR(254) DEFAULT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT NOT NULL,
                details JSONB DEFAULT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        console.error("Connection details:", {
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            port: 5432
        });
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw error;
    }
    pool.on("error", (error) => {
        console.error("PostgreSQL pool error:", error.message);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    })
}
