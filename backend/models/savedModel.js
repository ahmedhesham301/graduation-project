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
                p.id AS property_id,
                pt.name AS type,
                ST_Y(p.coordinates) AS lat,
                ST_X(p.coordinates) AS lon,
                p.area,
                p.floors,
                p.rooms,
                p.bathrooms,
                c.name AS city,
                d.name AS district,
                p.description,
                p.price,
                p.sold_at,
                p.sold_price,
                pm.s3_key || '.' || pm.extension AS media
               FROM saved s
               JOIN properties p ON p.id = s.property_id
               JOIN cities c
                    ON c.id = p.city_id
                JOIN districts d
                    ON d.id = p.district_id
                JOIN property_types pt
                    ON pt.id = p.type_id
                LEFT JOIN LATERAL (
                    SELECT s3_key, extension
                    FROM property_media
                    WHERE property_id = p.id AND uploaded_at IS NOT NULL
                    ORDER BY uploaded_at ASC
                    LIMIT 1
                    ) pm ON true
               WHERE s.user_id = $1
               AND p.deleted_at IS NULL
               ORDER BY s.id DESC`,
        values: [userId]
    }
    const { rows } = await pool.query(query)
    return rows
}

export async function removeSavedProperty(userId, propertyId) {
    const query = {
        name: 'remove-saved-property',
        text: `DELETE FROM saved
               WHERE user_id = $1 AND property_id = $2`,
        values: [userId, propertyId]
    }
    const { rowCount } = await pool.query(query)
    return rowCount > 0 // true = deleted, false = wasn't saved
}