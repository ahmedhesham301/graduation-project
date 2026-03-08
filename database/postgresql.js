import { Pool } from "pg"

export const pool = new Pool()

export async function initDB() {
    try {
        await pool.query("SELECT now()")

    } catch (error) {
        console.error("Failed to initialize connection to db")
        process.exit(1)
    }
    pool.on("error", (error) => {
        console.error("PostgreSQL pool error")
        process.exit(1)
    })
}
