
import { pool } from "../database/postgresql.js";

export async function findPropertyById(id, pendingMedia = null) {
    const query = {
        name: 'find-property-by-id',
        text: `SELECT
        p.id, p.seller_id,
        u.full_name AS seller_name, u.email AS seller_email, u.phone AS seller_phone, p.condition,
        pt.name AS type,ST_Y(p.coordinates) AS lat,ST_X(p.coordinates) AS lon,
        p.area, p.floors, p.rooms, p.bathrooms, c.name AS city, d.name AS district, p.description, p.price, p.deleted_at, p.sold_at, p.sold_price, p.is_draft,
        EXISTS (SELECT 1 FROM property_media WHERE property_id = p.id AND extension = 'zip' AND uploaded_at IS NOT NULL) AS has_360_view
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
        WHERE p.id = $1 AND p.deleted_at IS NULL AND ($2::boolean IS NULL OR p.pending_media = $2);`,
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

export async function createDraftRecord(sellerId, data) {
    const {
        type = null, lat = null, lon = null, area = null, floors = null,
        rooms = null, bathrooms = null, city = null, district = null,
        description = null, price = null, condition = null
    } = data;

    const query = {
        name: 'create-draft',
        text: `INSERT INTO properties 
                (seller_id, type_id, coordinates, area, floors, rooms, bathrooms, city_id, district_id, description, price, condition, is_draft, pending_media)
               VALUES 
                ($1,
                 ${type ? `(SELECT id FROM property_types WHERE name=$2)` : 'NULL'},
                 ${lat && lon ? `POINT($3, $4)::geometry` : 'NULL'},
                 ${area ? '$5' : 'NULL'}, ${floors ? '$6' : 'NULL'}, ${rooms ? '$7' : 'NULL'}, ${bathrooms ? '$8' : 'NULL'},
                 ${city ? `(SELECT id FROM cities WHERE name = $9)` : 'NULL'},
                 ${district ? `(SELECT id FROM districts WHERE name = $10 AND city_id = (SELECT id FROM cities WHERE name = $9))` : 'NULL'},
                 $11, ${price ? '$12' : 'NULL'}, ${condition ? '$13' : 'NULL'},
                 TRUE, TRUE)
               RETURNING *`,
        values: [sellerId, type, lon, lat, area, floors, rooms, bathrooms, city, district, description || null, price, condition].filter(v => v !== undefined)
    };
    const { rows } = await pool.query(query);
    return rows[0];
}

export async function updateDraftRecord(propertyId, sellerId, data) {
    const fields = [];
    const values = [];
    let i = 1;

    const addField = (col, val) => {
        if (val !== undefined && val !== null && val !== '') {
            fields.push(`${col} = $${i++}`);
            values.push(val);
        }
    };

    if (data.type) {
        fields.push(`type_id = (SELECT id FROM property_types WHERE name = $${i++})`);
        values.push(data.type);
    }
    if (data.lat && data.lon) {
        fields.push(`coordinates = POINT($${i++}, $${i++})::geometry`);
        values.push(data.lon, data.lat);
    }
    addField('area', data.area ? Number(data.area) : undefined);
    addField('floors', data.floors ? Number(data.floors) : undefined);
    addField('rooms', data.rooms ? Number(data.rooms) : undefined);
    addField('bathrooms', data.bathrooms ? Number(data.bathrooms) : undefined);
    if (data.city) {
        fields.push(`city_id = (SELECT id FROM cities WHERE name = $${i++})`);
        values.push(data.city);
    }
    if (data.district && data.city) {
        fields.push(`district_id = (SELECT id FROM districts WHERE name = $${i++} AND city_id = (SELECT id FROM cities WHERE name = $${i++}))`);
        values.push(data.district, data.city);
    }
    addField('description', data.description);
    addField('price', data.price ? Number(data.price) : undefined);
    addField('condition', data.condition);

    if (fields.length === 0) return null;

    values.push(propertyId, sellerId);
    const query = {
        name: 'update-draft',
        text: `UPDATE properties SET ${fields.join(', ')} WHERE id = $${i++} AND seller_id = $${i} AND is_draft = TRUE RETURNING *`,
        values
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}

export async function getDraftById(propertyId, sellerId) {
    const query = {
        name: 'get-draft',
        text: `SELECT * FROM properties WHERE id = $1 AND seller_id = $2 AND is_draft = TRUE AND deleted_at IS NULL`,
        values: [propertyId, sellerId]
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}

export async function publishDraft(propertyId, sellerId) {
    const query = {
        name: 'publish-draft',
        text: `UPDATE properties SET is_draft = FALSE WHERE id = $1 AND seller_id = $2 AND is_draft = TRUE RETURNING *`,
        values: [propertyId, sellerId]
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}

export async function updatePropertyRecord(propertyId, updates) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // Lock the row so the old price we record cannot change mid-update.
        const currentResult = await client.query({
            text: `
                SELECT id, price
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
        if ("rooms" in updates) addField("rooms", updates.rooms)
        if ("bathrooms" in updates) addField("bathrooms", updates.bathrooms)
        if ("floors" in updates) addField("floors", updates.floors)
        if ("area" in updates) addField("area", updates.area)

        if ("type" in updates) {
            fields.push(`type_id = (SELECT id FROM property_types WHERE name = $${index++})`)
            values.push(updates.type)
        }

        if ("sold_at" in updates) {
            addField("sold_at", updates.sold_at)
            if (updates.sold_at === null && !("sold_price" in updates)) {
                addField("sold_price", null)
            }
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


    clauses.push("p.deleted_at IS NULL", "p.pending_media=false", "p.moderation_status = 'approved'")

    let limit = PAGE_SIZE;
    try {
        const limitCheck = await pool.query("SELECT value FROM site_settings WHERE key = 'featured_properties_limit'");
        if (limitCheck.rows.length > 0) {
            const parsed = parseInt(limitCheck.rows[0].value, 10);
            if (!isNaN(parsed) && parsed > 0) {
                // If it's a page 1 search for Cairo properties with no other filter parameters, apply the featured limit
                const isHomepageFeatured = (Number(page) === 1 && city?.toLowerCase() === 'cairo' && Object.keys(filters).length === 0 && !minPrice && !maxPrice && !district);
                if (isHomepageFeatured) {
                    limit = parsed;
                }
            }
        }
    } catch (err) {
        console.error("Error reading featured_properties_limit:", err);
    }

    const offset = (page - 1) * PAGE_SIZE

    const query = {
        text: `
    SELECT
      p.id, pt.name AS type, p.area, p.floors, p.rooms, p.bathrooms, p.price, p.condition,
      c.name AS city, d.name AS district, p.sold_at, p.sold_price,
      pm.s3_key || '.' || pm.extension AS media,
      EXISTS (SELECT 1 FROM property_media WHERE property_id = p.id AND extension = 'zip' AND uploaded_at IS NOT NULL) AS has_360_view
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
    LIMIT ${limit};
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
                p.sold_at,
                p.sold_price,
                ST_Y(p.coordinates) AS lat,
                ST_X(p.coordinates) AS lon,
                c.name AS city,
                d.name AS district,
                ROUND((ST_Distance(
                    p.coordinates::geography,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                ) / 1000)::numeric, 2) AS distance_km,
                pm.s3_key || '.' || pm.extension AS media,
                EXISTS (SELECT 1 FROM property_media WHERE property_id = p.id AND extension = 'zip' AND uploaded_at IS NOT NULL) AS has_360_view
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
                AND p.moderation_status = 'approved'
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

export async function getSellerProperties(sellerId) {
    const query = {
        name: 'get-seller-properties',
        text: `SELECT p.id, pt.name AS type, p.area, p.rooms, p.bathrooms, p.price, p.condition,
                    c.name AS city, d.name AS district, p.description, p.created_at, p.sold_at, p.sold_price, p.moderation_status, p.rejection_reason, p.is_draft,
                    (SELECT s3_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.uploaded_at ASC LIMIT 1) AS thumbnail
             FROM properties p
             LEFT JOIN cities c ON c.id = p.city_id
             LEFT JOIN districts d ON d.id = p.district_id
             LEFT JOIN property_types pt ON pt.id = p.type_id
             WHERE p.seller_id = $1 AND p.deleted_at IS NULL
             ORDER BY p.is_draft DESC, p.created_at DESC`,
        values: [sellerId]
    }
    const { rows } = await pool.query(query)
    return rows
}
