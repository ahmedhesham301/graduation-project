import { pool } from "../database/postgresql.js";


export async function saveProperty(userId, propertyId) {
    const query = {
        name: 'save-property',
        text: `INSERT INTO saved (user_id, property_id)
               VALUES ($1, $2)
               ON CONFLICT (user_id, property_id) DO NOTHING
               RETURNING *`,
        values: [userId, propertyId]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null // null means it was already saved
}

export async function getSavedProperties(userId) {
    const query = {
        name: 'get-saved-properties',
        text: `SELECT
                s.id AS saved_id,
                p.id,
                p.type,
                ST_Y(p.coordinates) AS lat,
                ST_X(p.coordinates) AS lon,
                p.area,
                p.floors,
                p.rooms,
                p.bathrooms,
                p.city_id,
                p.district_id,
                p.description,
                p.price,
                p.status,
                p.created_at
               FROM saved s
               JOIN properties p ON p.id = s.property_id
               WHERE s.user_id = $1
               AND p.status = 'active'
               ORDER BY s.id DESC`,
        values: [userId]
    }
    const { rows } = await pool.query(query)
    return rows
}
