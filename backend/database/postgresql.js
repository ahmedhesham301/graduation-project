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
