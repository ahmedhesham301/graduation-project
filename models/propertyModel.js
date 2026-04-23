
import { pool } from "../database/postgresql.js";

export async function findPropertyById(id) {
    const query = {
        name: 'find-property-by-id',
        text: `SELECT id, seller_id, type,  ST_Y(coordinates) AS lat, ST_X(coordinates) AS lon, area, floors, rooms, bathrooms, city_id, district_id, description, price, deleted_at
            FROM properties
            WHERE id = $1 AND pending_media=false;`,
        values: [id]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}

//
export async function createPropertyRecord(sellerId, type, lat, lon, area, floors, rooms, bathrooms, cityID, districtID, description, price) {
    const query = {
        name: 'create-property',
        text: `INSERT INTO properties 
                (seller_id, type, coordinates, area, floors, rooms, bathrooms, city_id, district_id, description, price)
               VALUES 
                ($1, $2, POINT($3, $4)::geometry, $5, $6, $7, $8, $9, $10, $11, $12)
               RETURNING *`,
        values: [sellerId, type, lon, lat, area, floors, rooms, bathrooms, cityID, districtID, description, price]
    }
    const { rows } = await pool.query(query)
    return rows[0]
}

const PAGE_SIZE = 20;
const filterMap = {
    city: (i) => `city_id = ${i}`,
    district: (i) => `district_id = ${i}`,
    bathrooms: (i) => `bathrooms = $${i}`,
    rooms: (i) => `rooms = $${i}`,
    area: (i) => `area = $${i}`,
    floors: (i) => `floors = $${i}`,
};

export async function search(page, orderBy, orderDirection, filters) {
    let index = 1
    let clauses = []
    let values = []
    let order
    if (orderBy && orderDirection) {
        order = `ORDER BY ${orderBy} ${orderDirection}`
    }

    for (const [key, value] of Object.entries(filters)) {

        if (key !== 'city' && key !== 'district') {
            clauses.push(filterMap[key](index))
            values.push(value)
            index++
        } else {
            clauses.push(filterMap[key](value))
        }
    }
    clauses.push("deleted_at IS NULL", "pending_media=false")

    const offset = (page - 1) * PAGE_SIZE

    const query = {
        text: `SELECT id, type, area, floors, rooms, bathrooms, city_id, district_id, price
        FROM properties
        WHERE ${clauses.join(" AND ")}
        ${order ?? ''}
        OFFSET ${offset}
        LIMIT ${PAGE_SIZE};`,
        values: values
    }

    const { rows } = await pool.query(query)
    return rows
}

export async function deletePropertyById(id) {
    const query = {
        name: 'delete-property-by-id',
        text: `UPDATE properties
               SET deleted_at = now()
               WHERE id = $1 AND deleted_at IS NULL`,
        values: [id]
    }
    return await pool.query(query)
}

export async function publishProperty(propertyId) {
    const query = {
        name: 'publish-property',
        text: `update properties SET pending_media = false WHERE id = $1;`,
        values: [propertyId]
    }

    let result = await pool.query(query)
}