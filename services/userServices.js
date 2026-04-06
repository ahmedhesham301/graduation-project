import bcrypt from "bcrypt"
import { pool } from "../database/postgresql.js"
import { save, findByEmail, updateRoleWithClient, createSellerProfileWithClient  } from "../models/userModel.js";

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
        await updateRoleWithClient(client, userId, 'seller')      
        await createSellerProfileWithClient(client, userId)        
        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}