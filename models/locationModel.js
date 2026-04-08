import { pool } from "../database/postgresql.js";



export async function getCities() {
    let result = await pool.query("SELECT id, name FROM cities")
    return result.rows
}

export async function getDistricts() {
    let result = await pool.query("SELECT id, name FROM districts")
    return result.rows
}