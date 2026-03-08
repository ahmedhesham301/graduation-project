
// Purpose: Controller functions for Properties + Media + Features (PostgreSQL/pg)

import { pool } from "../database/postgresql.js";


const PROPERTY_STATUS = new Set(["active", "sold", "archived"]);

function buildListQuery(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    city,
    district,
    status,
    type,
    seller_id,
    min_price,
    max_price,
    min_area,
    max_area,
    rooms,
    bathrooms,
    floors,
    search,
    orderBy = "created_at",
    orderDir = "DESC",
  } = params;

  const where = [];
  const values = [];
  let i = 1;

  if (city)      { where.push(`city = $${i++}`); values.push(city); }
  if (district)  { where.push(`district = $${i++}`); values.push(district); }
  if (status)    { where.push(`status = $${i++}`); values.push(status); }
  if (type)      { where.push(`type = $${i++}`); values.push(type); }
  if (seller_id) { where.push(`seller_id = $${i++}`); values.push(Number(seller_id)); }
  if (min_price) { where.push(`price >= $${i++}`); values.push(min_price); }
  if (max_price) { where.push(`price <= $${i++}`); values.push(max_price); }
  if (min_area)  { where.push(`area >= $${i++}`); values.push(Number(min_area)); }
  if (max_area)  { where.push(`area <= $${i++}`); values.push(Number(max_area)); }
  if (rooms)     { where.push(`rooms >= $${i++}`); values.push(Number(rooms)); }
  if (bathrooms) { where.push(`bathrooms >= $${i++}`); values.push(Number(bathrooms)); }
  if (floors)    { where.push(`floors >= $${i++}`); values.push(Number(floors)); }
  if (search) {
    where.push(`(type ILIKE $${i} OR location ILIKE $${i} OR description ILIKE $${i} OR city ILIKE $${i} OR district ILIKE $${i})`);
    values.push(`%${search}%`);
    i++;
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit  = Math.min(Number(pageSize) || 10, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  // whitelist for ORDER BY
  const orderable = new Set(["created_at", "price", "area", "city", "district", "status"]);
  const col = orderable.has(orderBy) ? orderBy : "created_at";
  const dir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataSql = `
    SELECT *
    FROM properties
    ${whereSQL}
    ORDER BY ${col} ${dir}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countSql = `
    SELECT COUNT(*)::int AS count
    FROM properties
    ${whereSQL}
  `;

  return { dataSql, countSql, values, limit, page };
}

// ---------- Properties ----------

export async function listProperties(req, res) {
  try {
    const { dataSql, countSql, values, limit, page } = buildListQuery(req.query);

    const [{ rows: dataRows }, { rows: countRows }] = await Promise.all([
      pool.query({ text: dataSql, values }),
      pool.query({ text: countSql, values }),
    ]);

    const total = countRows[0]?.count || 0;
    return res.json({
      data: dataRows,
      pagination: {
        page: Number(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /properties error:", err);
    return res.status(500).json({ error: "Failed to fetch properties" });
  }
}

export async function getProperty(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    const { rows } = await pool.query({
      text: "SELECT * FROM properties WHERE id = $1",
      values: [id],
    });
    if (!rows[0]) return res.status(404).json({ error: "Property not found" });

    return res.json(rows[0]);
  } catch (err) {
    console.error("GET /properties/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch property" });
  }
}

export async function createProperty(req, res) {
  try {
    const allowed = [
      "seller_id", "type", "location", "area", "floors", "rooms",
      "bathrooms", "city", "district", "description", "price", "status",
    ];
    const cols = [];
    const vals = [];
    const ph = [];
    let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        cols.push(k);
        vals.push(req.body[k]);
        ph.push(`$${i++}`);
      }
    }
    if (!cols.length) return res.status(400).json({ error: "No valid fields provided" });

    const sql = `
      INSERT INTO properties (${cols.join(", ")})
      VALUES (${ph.join(", ")})
      RETURNING *
    `;
    const { rows } = await pool.query({ text: sql, values: vals });
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /properties error:", err);
    // map PG errors
    if (err.code === "23505") return res.status(409).json({ error: err.detail || "Unique constraint violated" });
    if (err.code === "23503") return res.status(422).json({ error: err.detail || "Foreign key constraint violated" });
    if (err.code === "23514") return res.status(422).json({ error: err.detail || "Check constraint violated" });
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function updateProperty(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    const allowed = [
      "seller_id", "type", "location", "area", "floors", "rooms",
      "bathrooms", "city", "district", "description", "price", "status",
    ];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        sets.push(`${k} = $${i++}`);
        vals.push(req.body[k]);
      }
    }
    if (!sets.length) {
      // nothing to update -> return current row (or 400)
      const { rows } = await pool.query({ text: "SELECT * FROM properties WHERE id = $1", values: [id] });
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Property not found" });
    }

    vals.push(id);
    const sql = `UPDATE properties SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    const { rows } = await pool.query({ text: sql, values: vals });
    if (!rows[0]) return res.status(404).json({ error: "Property not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("PUT /properties/:id error:", err);
    if (err.code === "23505") return res.status(409).json({ error: err.detail || "Unique constraint violated" });
    if (err.code === "23503") return res.status(422).json({ error: err.detail || "Foreign key constraint violated" });
    if (err.code === "23514") return res.status(422).json({ error: err.detail || "Check constraint violated" });
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

export async function deleteProperty(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM saved WHERE property_id = $1`, [id]);
    await client.query(`DELETE FROM property_features WHERE property_id = $1`, [id]);
    await client.query(`DELETE FROM property_media WHERE property_id = $1`, [id]);
    const { rowCount } = await client.query(`DELETE FROM properties WHERE id = $1`, [id]);
    await client.query("COMMIT");

    if (!rowCount) return res.status(404).json({ error: "Property not found" });
    return res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE /properties/:id error:", err);
    const status = err.code?.startsWith?.("23") ? 422 : 400;
    return res.status(status).json({ error: err.detail || err.message || "Delete failed" });
  } finally {
    client.release();
  }
}

// ---------- Media ----------

export async function listPropertyMedia(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const { rows } = await pool.query({
      text: "SELECT * FROM property_media WHERE property_id = $1 ORDER BY created_at DESC",
      values: [id],
    });
    return res.json(rows);
  } catch (err) {
    console.error("GET /properties/:id/media error:", err);
    return res.status(500).json({ error: "Failed to fetch media" });
  }
}

export async function addPropertyMedia(req, res) {
  try {
    const id = Number(req.params.id);
    const { url, media_type } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    if (!url || !media_type) return res.status(400).json({ error: "url and media_type are required" });

    const { rows } = await pool.query({
      text: `INSERT INTO property_media (property_id, url, media_type) VALUES ($1, $2, $3) RETURNING *`,
      values: [id, url, media_type],
    });
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /properties/:id/media error:", err);
    const status = err.code?.startsWith?.("23") ? 422 : 400;
    return res.status(status).json({ error: err.detail || err.message || "Create media failed" });
  }
}

// ---------- Features ----------

export async function listPropertyFeatures(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const { rows } = await pool.query({
      text: `
        SELECT pf.id, pf.property_id, pf.feature_id, f.name AS feature_name
        FROM property_features pf
        JOIN features f ON f.id = pf.feature_id
        WHERE pf.property_id = $1
        ORDER BY f.name ASC
      `,
      values: [id],
    });
    return res.json(rows);
  } catch (err) {
    console.error("GET /properties/:id/features error:", err);
    return res.status(500).json({ error: "Failed to fetch features" });
  }
}

export async function addPropertyFeature(req, res) {
  try {
    const id = Number(req.params.id);
    const { feature_id, feature_name } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    if (!feature_id && !feature_name) {
      return res.status(400).json({ error: "feature_id or feature_name is required" });
    }

    let finalFeatureId = feature_id;
    if (!finalFeatureId && feature_name) {
      const { rows } = await pool.query({
        text: `
          INSERT INTO features (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `,
        values: [feature_name],
      });
      finalFeatureId = rows[0].id;
    }

    const { rows } = await pool.query({
      text: `
        INSERT INTO property_features (property_id, feature_id)
        VALUES ($1, $2)
        ON CONFLICT (property_id, feature_id) DO NOTHING
        RETURNING *
      `,
      values: [id, finalFeatureId],
    });

    return res.status(201).json(rows[0] || { property_id: id, feature_id: finalFeatureId, existed: true });
  } catch (err) {
    console.error("POST /properties/:id/features error:", err);
    const status = err.code?.startsWith?.("23") ? 422 : 400;
    return res.status(status).json({ error: err.detail || err.message || "Add feature failed" });
  }
}

export async function removePropertyFeature(req, res) {
  try {
    const propertyId = Number(req.params.id);
    const featureId = Number(req.params.featureId);
    if (!Number.isInteger(propertyId) || !Number.isInteger(featureId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }

    const { rowCount } = await pool.query({
      text: `DELETE FROM property_features WHERE property_id = $1 AND feature_id = $2`,
      values: [propertyId, featureId],
    });

    if (!rowCount) return res.status(404).json({ error: "Not linked or already removed" });
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /properties/:id/features/:featureId error:", err);
    return res.status(500).json({ error: "Failed to remove feature" });
  }
}

// ---------- Validation (for router) ----------

export function validatePropertyBody(req, res, next) {
  const b = req.body || {};
  const isPost = req.method === "POST";

  if (isPost) {
    const required = [
      "seller_id", "type", "location", "area", "floors", "rooms",
      "bathrooms", "city", "district", "price",
    ];
    for (const f of required) {
      if (b[f] === undefined || b[f] === null || b[f] === "") {
        return res.status(400).json({ error: `${f} is required` });
      }
    }
  }

  const mustBePosInt = ["area", "floors", "rooms", "bathrooms", "price"];
  const bad = mustBePosInt.filter((k) => b[k] !== undefined && !(Number.isInteger(Number(b[k])) && Number(b[k]) > 0));
  if (bad.length) return res.status(400).json({ error: `${bad.join(", ")} must be positive integers` });

  if (b.status !== undefined && !PROPERTY_STATUS.has(String(b.status))) {
    return res.status(400).json({ error: `status must be one of: ${Array.from(PROPERTY_STATUS).join(", ")}` });
  }

  return next();
}
``