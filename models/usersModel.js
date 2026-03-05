import { pool } from "../database/postgresql.js";

export async function save(fullName, email, phone, password_hash, role) {
    const query = {
        name: 'insert-user',
        text: "INSERT INTO users(full_name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
        values: [fullName, email, phone, password_hash, role]
    }
    await pool.query(query)
}