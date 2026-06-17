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
        createdAt: result.rows[0].created_at,
        failedLoginAttempts: result.rows[0].failed_login_attempts || 0,
        lockoutUntil: result.rows[0].lockout_until || null
    }
}

export async function incrementFailedAttempts(userId, currentFailedAttempts) {
    const attempts = currentFailedAttempts + 1;
    let lockoutUntil = null;
    if (attempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
    }
    await pool.query(
        "UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3",
        [attempts, lockoutUntil, userId]
    );
    return { attempts, lockoutUntil };
}

export async function resetFailedAttempts(userId) {
    await pool.query(
        "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1",
        [userId]
    );
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


export async function upgradeToSeller(userId, businessName, businessType, nationalId) {
    const existing = await pool.query(
        'SELECT id, status FROM seller_profile WHERE user_id = $1',
        [userId]
    )
    if (existing.rows.length > 0) {
        const status = existing.rows[0].status
        if (status === 'pending') {
            const err = new Error("Your seller request is already pending review")
            err.code = 'ALREADY_PENDING'
            throw err
        }
        if (status === 'verified') {
            const err = new Error("You are already a verified seller")
            err.code = 'ALREADY_VERIFIED'
            throw err
        }
        // If rejected, allow resubmission
        await pool.query(
            `UPDATE seller_profile SET status = 'pending', business_name = $1, business_type = $2, national_id = $3, submitted_at = NOW(), rejection_reason = NULL, reviewed_at = NULL WHERE user_id = $4`,
            [businessName, businessType, nationalId, userId]
        )
    } else {
        await pool.query(
            `INSERT INTO seller_profile (user_id, status, business_name, business_type, national_id, submitted_at)
             VALUES ($1, 'pending', $2, $3, $4, NOW())`,
            [userId, businessName, businessType, nationalId]
        )
    }
}

export async function getSellerProfileByUserId(userId) {
    const result = await pool.query(
        'SELECT status, business_name, business_type, national_id, rejection_reason, submitted_at, reviewed_at FROM seller_profile WHERE user_id = $1',
        [userId]
    )
    return result.rows[0] || null
}
export async function findUserById(id) {
    const query = {
        name: 'find-user-profile-by-id',
        text: `SELECT id, full_name, email, phone, role FROM users WHERE id = $1`,
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