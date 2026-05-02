import { Pool } from "pg"
import fs from "fs";
let poolConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    // ssl,
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
        await pool.query("SELECT now()")

    } catch (error) {
        console.error("error", error)
        process.exit(1)
    }
    pool.on("error", (error) => {
        console.error("PostgreSQL pool error")
        process.exit(1)
    })
}
