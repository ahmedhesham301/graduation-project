import { pool } from "../database/postgresql.js";

export async function getInbox(userId) {
    const query = {
        name: 'get-chat-inbox',
        text: `WITH latest AS (
           SELECT
             cm.*,
             CASE WHEN cm.sender_id = $1 THEN cm.receiver_id ELSE cm.sender_id END AS other_user_id,
             ROW_NUMBER() OVER (
               PARTITION BY cm.property_id, LEAST(cm.sender_id, cm.receiver_id), GREATEST(cm.sender_id, cm.receiver_id)
               ORDER BY cm.created_at DESC
             ) as rn
           FROM chat_messages cm
           WHERE cm.sender_id = $1 OR cm.receiver_id = $1
         )
         SELECT
           l.property_id AS "propertyId",
           p.description AS "title",
           p.seller_id AS "sellerId",
           (SELECT s3_key FROM property_media pm WHERE pm.property_id = p.id ORDER BY pm.uploaded_at ASC LIMIT 1) AS "thumbnail",
           u.id AS "otherUserId",
           u.full_name AS "otherUserName",
           u.email AS "otherUserEmail",
           u.phone AS "otherUserPhone",
           l.content,
           l.created_at AS "timestamp"
         FROM latest l
         JOIN properties p ON p.id = l.property_id
         JOIN users u ON u.id = l.other_user_id
         WHERE l.rn = 1
         ORDER BY l.created_at DESC`,
        values: [userId]
    }
    const { rows } = await pool.query(query)
    return rows
}

export async function createMessage(senderId, receiverId, propertyId, content) {
    const query = {
        name: 'create-chat-message',
        text: `INSERT INTO chat_messages (sender_id, receiver_id, property_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING
             id,
             sender_id   AS "senderId",
             receiver_id AS "receiverId",
             property_id AS "propertyId",
             content,
             created_at  AS "createdAt"`,
        values: [senderId, receiverId, propertyId, content]
    }
    const { rows } = await pool.query(query)
    return rows[0]
}

export async function getConversation(propertyId, userId1, userId2) {
    const query = {
        name: 'get-chat-conversation',
        text: `SELECT
           id,
           sender_id   AS "senderId",
           receiver_id AS "receiverId",
           property_id AS "propertyId",
           content,
           created_at  AS "createdAt"
         FROM chat_messages
         WHERE property_id = $1
           AND ((sender_id = $2 AND receiver_id = $3) OR
                (sender_id = $3 AND receiver_id = $2))
         ORDER BY created_at ASC`,
        values: [propertyId, userId1, userId2]
    }
    const { rows } = await pool.query(query)
    return rows
}
