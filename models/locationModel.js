import { pool } from "../database/postgresql.js";

export async function findAllCities() {
    const query = {
        name: 'find-all-cities',
        text: `SELECT name FROM cities ORDER BY name ASC`,
        values: []
    }
    const { rows } = await pool.query(query)
    return rows.map(row => row.name)  
}

