
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
export async function create(sellerId, type, coordinates, area, floors, rooms, bathrooms, cityID, districtID, description, price) {
    const query = {
        name: 'create-property',
        text: `INSERT INTO properties 
                (seller_id, type, coordinates, area, floors, rooms, bathrooms, city_id, district_id, description, price)
               VALUES 
                ($1, $2, POINT($3, $4)::geometry, $5, $6, $7, $8, $9, $10, $11, $12)
               RETURNING *`,
        values: [sellerId, type, coordinates["lon"], coordinates["lat"], area, floors, rooms, bathrooms, cityID, districtID, description, price]
    }
    const { rows } = await pool.query(query)
    return rows[0]
}
// TODO: use cache for city,district id to handle non existing cities without making round trips to the db
const PAGE_SIZE = 20;
const filterMap = {
    city: (i) => `city_id = (SELECT id FROM cities WHERE name = $${i})`,
    district: (i) => `district_id = (SELECT id FROM districts WHERE name = $${i})`,
    bathrooms: (i) => `bathrooms = $${i}`,
    rooms: (i) => `rooms = $${i}`,
    area: (i) => `area = $${i}`,
    floors: (i) => `floors = $${i}`,
};

export async function search(page, filters) {
    let index = 1
    let clauses = []
    let values = []
    
    for (const [key, value] of Object.entries(filters)) {
        clauses.push(filterMap[key](index))
        values.push(value)
        index++
    }
    clauses.push("status='active'")

    const offset = (page -1) * PAGE_SIZE 

    const query = {
        text: `SELECT *
        FROM properties
        WHERE ${clauses.join(" AND ")}
        OFFSET ${offset}
        LIMIT ${PAGE_SIZE};`,
        values: values
    }

    const { rows } = await pool.query(query)
    return rows
}