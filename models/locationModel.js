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
export async function findDistrictsByCityName(cityName) {
    const query = {
        name: 'find-districts-by-city-name',
        text: `SELECT name FROM districts
               WHERE city_id = (SELECT id FROM cities WHERE name = $1)
               ORDER BY name ASC`,
        values: [cityName]
    }
    const { rows } = await pool.query(query)
    return rows.map(row => row.name)
}

