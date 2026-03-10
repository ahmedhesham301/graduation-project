
import { pool } from "../database/postgresql.js";



export async function findAll() {
    const query = {
        name: 'find-all-properties', 
        text: `SELECT 
                p.*,
                u.full_name AS seller_name
               FROM properties p
               JOIN users u ON u.id = p.seller_id
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
               FROM properties p
               JOIN users u ON u.id = p.seller_id
               WHERE p.id = $1`,
        values: [id]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null 
}

//
export async function create(sellerId, type, location, area, floors, rooms, bathrooms, city, district, description, price) {
    const query = {
        name: 'create-property',
        text: `INSERT INTO properties 
                (seller_id, type, location, area, floors, rooms, bathrooms, city, district, description, price)
               VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               RETURNING *`,
        values: [sellerId, type, location, area, floors, rooms, bathrooms, city, district, description, price]
    }
    const { rows } = await pool.query(query)
    return rows[0] 
}