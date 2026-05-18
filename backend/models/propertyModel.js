
import { pool } from "../database/postgresql.js";

export async function findPropertyById(id, pendingMedia = null) {
    const query = {
        name: 'find-property-by-id',
        text: `SELECT 
        p.id, p.seller_id,
        u.full_name AS seller_name, u.email AS seller_email, u.phone AS seller_phone, p.condition,
        pt.name AS type,ST_Y(p.coordinates) AS lat,ST_X(p.coordinates) AS lon,
        p.area, p.floors, p.rooms, p.bathrooms, c.name AS city, d.name AS district, p.description, p.price, p.deleted_at
        FROM properties p
        JOIN users u
            ON u.id = p.seller_id
        JOIN cities c 
            ON c.id = p.city_id
        JOIN districts d 
            ON d.id = p.district_id
            AND d.city_id = c.id
        JOIN property_types pt
            ON pt.id = p.type_id
        WHERE p.id = $1 AND ($2::boolean IS NULL OR p.pending_media = $2);`,
        values: [id, pendingMedia ?? null]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}

//
export async function createPropertyRecord(sellerId, type, lat, lon, area, floors, rooms, bathrooms, city, district, description, price, condition) {
    const query = {
        name: 'create-property',
        text: `INSERT INTO properties 
                (seller_id, type_id, coordinates, area, floors, rooms, bathrooms, city_id, district_id, description, price, condition)
               VALUES 
                ($1, (SELECT id FROM property_types WHERE name=$2), POINT($3, $4)::geometry, $5, $6, $7, $8,
                (SELECT id FROM cities WHERE name = $9), 
                (SELECT id FROM districts WHERE name = $10 AND city_id = (SELECT id FROM cities WHERE name = $9)), $11, $12, $13)
               RETURNING *`,
        values: [sellerId, type, lon, lat, area, floors, rooms, bathrooms, city, district, description, price, condition]
    }
    const { rows } = await pool.query(query)
    return rows[0]
}

export async function updatePropertyRecord(propertyId, updates) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // Lock the row so the old price we record cannot change mid-update.
        const currentResult = await client.query({
            text: `
                SELECT id, price, status
                FROM properties
                WHERE id = $1
                AND deleted_at IS NULL
                FOR UPDATE
            `,
            values: [propertyId]
        })

        const currentProperty = currentResult.rows[0]
        if (!currentProperty) {
            await client.query("ROLLBACK")
            return null
        }

        const fields = []
        const values = []
        let index = 1

        function addField(column, value) {
            fields.push(`${column} = $${index++}`)
            values.push(value)
        }

        if ("description" in updates) addField("description", updates.description)
        if ("condition" in updates) addField("condition", updates.condition)
        if ("price" in updates) addField("price", updates.price)

        if ("status" in updates) {
            addField("status", updates.status)

            // A sold listing must have sold_at. If the caller only says
            // status=sold, record the sale time as now.
            if (updates.status === "sold" && (!("sold_at" in updates) || updates.sold_at === null)) {
                addField("sold_at", new Date())
            }

            // Non-sold listings should not keep stale sale data.
            if (updates.status !== "sold") {
                addField("sold_at", null)
                addField("sold_price", null)
            }
        }

        if ("sold_at" in updates && !(updates.status === "sold" && updates.sold_at === null)) {
            addField("sold_at", updates.sold_at)
        }
        if ("sold_price" in updates) addField("sold_price", updates.sold_price)

        values.push(propertyId)

        const updatedResult = await client.query({
            text: `
                UPDATE properties
                SET ${fields.join(", ")}
                WHERE id = $${index}
                RETURNING *
            `,
            values
        })

        const updatedProperty = updatedResult.rows[0]
        const newPrice = Number(updatedProperty.price)
        const oldPrice = Number(currentProperty.price)

        if ("price" in updates && newPrice !== oldPrice) {
            await client.query({
                text: `
                    INSERT INTO property_price_history (property_id, old_price, new_price)
                    VALUES ($1, $2, $3)
                `,
                values: [propertyId, oldPrice, newPrice]
            })
        }

        await client.query("COMMIT")
        return updatedProperty
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
}

const PAGE_SIZE = 20;
const filterMap = {
    bathrooms: (i) => `bathrooms = $${i}`,
    bedrooms: (i) => `rooms = $${i}`,
    area: (i) => `area = $${i}`,
    floors: (i) => `floors = $${i}`,
    type: (i) => `type_id = (SELECT id FROM property_types WHERE name = $${i})`,
    condition: (i) => `condition = $${i}`,
};

export async function search(page, orderBy, orderDirection, city, district, minPrice, maxPrice, filters) {
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

    if (minPrice && maxPrice) {
        clauses.push(`p.price BETWEEN $${index++} AND $${index++}`)
        values.push(minPrice, maxPrice)
    } else if (minPrice) {
        clauses.push(`p.price >= $${index++}`)
        values.push(minPrice)
    } else if (maxPrice) {
        clauses.push(`p.price <= $${index++}`)
        values.push(maxPrice)
    }


    clauses.push("p.deleted_at IS NULL", "p.pending_media=false")

    const offset = (page - 1) * PAGE_SIZE

    const query = {
        text: `
    SELECT
      p.id, pt.name AS type, p.area, p.floors, p.rooms, p.bathrooms, p.price, p.condition,
      c.name AS city, d.name AS district,
      pm.s3_key || '.' || pm.extension AS media
    FROM properties p
    JOIN cities c
      ON c.id = p.city_id
    JOIN districts d
      ON d.id = p.district_id
      AND d.city_id = c.id
    JOIN property_types pt
      ON pt.id = p.type_id
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
export async function findPropertiesNearby(lat, lon, radiusMeters, page) {
    const offset = (page - 1) * PAGE_SIZE

    const query = {
        text: `
            SELECT
                p.id,
                pt.name AS type,
                p.area,
                p.floors,
                p.rooms,
                p.bathrooms,
                p.price,
                ST_Y(p.coordinates) AS lat,
                ST_X(p.coordinates) AS lon,
                c.name AS city,
                d.name AS district,
                -- Distance in kilometers rounded to 2 decimal places
                ROUND((ST_Distance(
                    p.coordinates::geography,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                ) / 1000)::numeric, 2) AS distance_km,
                pm.s3_key || '.' || pm.extension AS media
            FROM properties p
            JOIN cities c
                ON c.id = p.city_id
            JOIN districts d
                ON d.id = p.district_id
                AND d.city_id = c.id
            JOIN property_types pt
                ON pt.id = p.type_id
            LEFT JOIN LATERAL (
                SELECT s3_key, extension
                FROM property_media
                WHERE property_id = p.id AND uploaded_at IS NOT NULL
                ORDER BY uploaded_at ASC
                LIMIT 1
            ) pm ON true
            WHERE
                p.deleted_at IS NULL
                AND p.pending_media = false
                AND ST_DWithin(
                    p.coordinates::geography,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                    $3
                )
            ORDER BY distance_km ASC
            OFFSET ${offset}
            LIMIT ${PAGE_SIZE}`,
        values: [lat, lon, radiusMeters]
    }

    const { rows } = await pool.query(query)
    return rows
}


export async function getTypes() {
    const query = {
        name: 'get-types',
        text: `SELECT name FROM property_types ORDER BY id`,
    }

    const { rows } = await pool.query(query)
    
    return rows.map(row => row.name)
}
