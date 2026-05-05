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
        name: result.rows[0].full_name,
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


export async function upgradeToSeller(userId) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        await client.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            ['seller', userId]
        )

        await client.query(
            `INSERT INTO seller_profile (user_id, status)
             VALUES ($1, 'unverified')
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        )

        await client.query('COMMIT')

    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
export async function findUserById(id) {
    const query = {
        name: 'find-user-profile-by-id',
        text: `SELECT full_name, email, phone FROM users WHERE id = $1`,
        values: [id]
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}

export async function updateUser(id, fields) {
    const allowed = ['full_name', 'phone', 'password_hash']
    const sets = []
    const values = []
    let i = 1

    for (const [key, val] of Object.entries(fields)) {
        if (allowed.includes(key)) {
            sets.push(`${key} = $${i++}`)
            values.push(val)
        }
    }

    if (sets.length === 0) return null

    values.push(id)
    const query = {
        text: `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING full_name, email, phone`,
        values
    }
    const { rows } = await pool.query(query)
    return rows[0] || null
}