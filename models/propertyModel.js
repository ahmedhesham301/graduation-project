
import { pool } from "../database/postgresql.js";



export async function findAll() {
    const query = {
        name: 'find-all-properties',
        text: `SELECT 
                p.*,
                u.full_name AS seller_name
                c.name AS city_name,
                d.name AS district_name
               FROM properties p
               JOIN users u ON u.id = p.seller_id
               JOIN cities c ON c.id = p.city_id
               JOIN districts d ON d.id = p.district_id
               WHERE p.status = 'active'
               ORDER BY p.created_at DESC`,
        values: []
    }
    const { rows } = await pool.query(query)
    return rows
}


export async function findById(id) {
    const query = {
        name: 'find-property-by-id',
        text: `SELECT 
                p.*,
                u.full_name AS seller_name
                c.name AS city_name,
                d.name AS district_name
               FROM properties p
               JOIN users u ON u.id = p.seller_id
               JOIN cities c ON c.id = p.city_id
               JOIN districts d ON d.id = p.district_id
               WHERE p.id = $1`,
        values: [id]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}

//
export async function create(sellerId, type, coordinates, area, floors, rooms, bathrooms, cityID, areaID, description, price) {
    const query = {
        name: 'create-property',
        text: `INSERT INTO properties 
                (seller_id, type, coordinates, area, floors, rooms, bathrooms, city_id, district_id, description, price)
               VALUES 
                ($1, $2, POINT($3, $4)::geometry, $5, $6, $7, $8, $9, $10, $11, $12)
               RETURNING *`,
        values: [sellerId, type, coordinates["lon"], coordinates["lat"], area, floors, rooms, bathrooms, cityID, areaID, description, price]
    }
    const { rows } = await pool.query(query)
    return rows[0]
}