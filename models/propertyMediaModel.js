import { pool } from "../database/postgresql.js";

export async function createPropertyMediaRecords(propertyId, propertyMediaRecords) {
    let parameterIndex = 1
    const valuePlaceholders = []
    const queryValues = []

    for (const mediaRecord of propertyMediaRecords) {
        valuePlaceholders.push(`($${parameterIndex++},$${parameterIndex++},$${parameterIndex++})`)
        queryValues.push(propertyId, mediaRecord.uuid, mediaRecord.extension)
    }

    const query = {
        text: `INSERT INTO property_media (property_id, s3_key, extension) VALUES
        ${valuePlaceholders.join(", ")};`,
        values: queryValues
    }
    await pool.query(query)
}

export async function setUploadedToNow(propertyId, mediaId) {
    const query = {
        name: 'set-media-uploaded',
        text: `update property_media SET uploaded_at = NOW() WHERE property_id = $1 AND s3_key = $2;`,
        values: [propertyId, mediaId]
    }

    const { rowCount } = await pool.query(query)
    return rowCount > 0
}

export async function isMediaFullyUploaded(propertyId) {
    const query = {
        name: 'is-media-fully-uploaded',
        text: `SELECT COUNT(*) FROM property_media WHERE property_id = $1 AND uploaded_at IS NULL`,
        values: [propertyId]
    }
    let result = await pool.query(query)
    if (result.rows[0].count != '0') return false

    return true
}

// export async function getMainPic(propertyId) {
    
// }

export async function getAllMedia(propertyId) {
    const query = {
        name: 'get-all-media',
        text: `SELECT * FROM property_media WHERE property_id = $1 AND uploaded_at IS NOT NULL ORDER BY uploaded_at`,
        values: [propertyId]
    }
    let result = await pool.query(query)
    return result.rows

}
