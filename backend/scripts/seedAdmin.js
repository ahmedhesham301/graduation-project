import bcrypt from "bcrypt";
import { pool } from "../database/postgresql.js";

const ADMIN_EMAIL = "admin@3akarati.com";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Super Admin";
const ADMIN_PHONE = "+201000000000";

async function seedAdmin() {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
    if (existing.rows.length > 0) {
        console.log("Admin already exists, skipping.");
        await pool.end();
        return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
        "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, 'admin')",
        [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, hash]
    );
    console.log("Admin user created:");
    console.log("  Email:", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    await pool.end();
}

seedAdmin().catch(err => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
});
