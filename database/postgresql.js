



import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool, types } = pg;


types.setTypeParser(20, (val) => {
  if (val === null) return null;
  const n = Number(val);
  return Number.isSafeInteger(n) ? n : val; // fallback to string if too large
});

// Prefer DATABASE_URL if provided
let poolConfig = {};
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { require: true, rejectUnauthorized: false } : undefined,
  };
} else {
  poolConfig = {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "postgres",
    ssl: process.env.DB_SSL === "true" ? { require: true, rejectUnauthorized: false } : undefined,
  };
}

export const pool = new Pool(poolConfig);

export async function initDB() {
  try {
    const { rows } = await pool.query("SELECT now()");
    console.log("✅ DB connected:", rows[0].now);
  } catch (error) {
    // Improved error details
    console.error("❌ Failed to initialize connection to db");
    console.error("   Error code:", error.code);
    console.error("   Message   :", error.message);
    console.error("   Hint      :", error.hint || "(no hint)");
    console.error("   Where     :", error.where || "(n/a)");
    console.error("   Detail    :", error.detail || "(n/a)");
    console.error("   Host/DB   :", poolConfig.host || "(via URL)", "/", poolConfig.database || "(via URL)");
    process.exit(1);
  }

  pool.on("error", (error) => {
    console.error("❌ PostgreSQL pool error");
    console.error("   Code  :", error.code);
    console.error("   Msg   :", error.message);
    process.exit(1);
  });
}
