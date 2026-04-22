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
