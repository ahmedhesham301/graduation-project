import { pool } from "../database/postgresql.js";

export async function save(fullName, email, phone, password_hash, role) {
    const query = {
        name: 'insert-user',
        text: "INSERT INTO users(full_name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
        values: [fullName, email, phone, password_hash, role]
    }
    await pool.query(query)
}

export async function findByEmail(email) {
    const query = {
        name: 'get-user-by-email',
        text: 'SELECT * FROM users WHERE email = $1;',
        values: [email]
    }
    const result = await pool.query(query)
    if (result.rowCount == 0) {
        return null
    }
    return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        passwordHash: result.rows[0].password_hash,
        role: result.rows[0].role,
        phone: result.rows[0].phone,
        createdAt: result.rows[0].created_at
    }
}
export async function findById(id) {
    const query = {
        name: 'find-user-by-id',
        text: 'SELECT id, role FROM users WHERE id = $1',
        values: [id]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}