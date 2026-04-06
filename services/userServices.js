import bcrypt from "bcrypt"
import { pool } from "../database/postgresql.js"
import { save, findByEmail, updateRole, createSellerProfile } from "../models/userModel.js";

export async function registerUser(fullName, email, phone, password, role) {
    const passwordHash = await bcrypt.hash(password, 10);
    await save(fullName, email, phone, passwordHash, role)
}

export async function authenticateUser(email, password) {
    const userData = await findByEmail(email)

    if (userData == null) {
        let err = new Error("Email not found");
        err.code = 'EMAIL_NOT_FOUND'
        throw err
    }

    if (await bcrypt.compare(password, userData.passwordHash)) {
        return userData
    }

    let err = new Error("wrong password");
    err.code = 'WRONG_PASSWORD'
    throw err
}

export async function becomeSeller(userId) {
    
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        // Step 1 — update role in users table
        await client.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            ['seller', userId]
        )

        // Step 2 — create seller_profile row
        // ON CONFLICT DO NOTHING handles the case where they call this twice
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