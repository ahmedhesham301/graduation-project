
import { pool } from "../database/postgresql.js";

export async function findPropertyById(id, pendingMedia = null) {
    const query = {
        name: 'find-property-by-id',
        text: `SELECT 
        p.id, p.seller_id, 
        p.type,ST_Y(p.coordinates) AS lat,ST_X(p.coordinates) AS lon,
        p.area, p.floors, p.rooms, p.bathrooms, c.name AS city, d.name AS district, p.description, p.price, p.deleted_at
        FROM properties p
        JOIN cities c 
            ON c.id = p.city_id
        JOIN districts d 
            ON d.id = p.district_id
            AND d.city_id = c.id
        WHERE p.id = $1 AND ($2::boolean IS NULL OR p.pending_media = $2);`,
        values: [id, pendingMedia ?? null]
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
    bathrooms: (i) => `bathrooms = $${i}`,
    bedrooms: (i) => `rooms = $${i}`,
    area: (i) => `area = $${i}`,
    floors: (i) => `floors = $${i}`,
};

export async function search(page, orderBy, orderDirection, city, district, filters) {
    let index = 1
    let clauses = []
    let values = []
    let order
    if (orderBy && orderDirection) {
        order = `ORDER BY ${orderBy} ${orderDirection}`
    }

    for (const [key, value] of Object.entries(filters)) {
        clauses.push(filterMap[key](index++))
        values.push(value)
    }

    if (district) {
        clauses.push(`p.district_id = (SELECT id FROM districts WHERE city_id = (SELECT id FROM cities WHERE name = $${index++}) AND name = $${index++})`)
        values.push(city, district)
    } else if (city) {
        clauses.push(`p.city_id = (SELECT id FROM cities WHERE name = $${index++})`)
        values.push(city)
    }

    clauses.push("p.deleted_at IS NULL", "p.pending_media=false")

    const offset = (page - 1) * PAGE_SIZE

    const query = {
        text: `
    SELECT
      p.id, p.type, p.area, p.floors, p.rooms, p.bathrooms, p.price,
      c.name AS city, d.name AS district,
      pm.s3_key || '.' || pm.extension AS media
    FROM properties p
    JOIN cities c
      ON c.id = p.city_id
    JOIN districts d
      ON d.id = p.district_id
     AND d.city_id = c.id
    LEFT JOIN LATERAL (
      SELECT s3_key, extension
      FROM property_media
      WHERE property_id = p.id AND uploaded_at IS NOT NULL
      ORDER BY uploaded_at ASC
      LIMIT 1
    ) pm ON true
    WHERE ${clauses.join(" AND ")}
    ${order ?? ""}
    OFFSET ${offset}
    LIMIT ${PAGE_SIZE};
  `,
        values
    };

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

    await pool.query(query)
}
