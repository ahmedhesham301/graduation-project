// File: server.js
// File: server.js
import express from "express";
import morgan from "morgan";
import { initDB, pool } from "./database/postgresql.js";

// Routers
import urlRouter from "./routes/usersRouter.js";
import propertyRouter from "./routes/propertyRouter.js";

await initDB();

const app = express();
app.use(morgan("dev"));

// Parse JSON only for methods that typically send bodies
app.use((req, res, next) => {
  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);
  if (!hasBody) return next();
  return express.json()(req, res, next);
});

// If you want to also parse JSON on DELETE, include it above.

// Health check (optional)
app.get("/_health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Debug DB (optional; remove in prod)
app.get("/_debug/db", async (req, res) => {
  try {
    const info = await pool.query(`SELECT current_database() AS db, current_schema() AS schema, now() AS ts`);
    const props = await pool.query(`SELECT to_regclass('public.properties') AS properties_reg`);
    res.json({ ...info.rows[0], properties_table: props.rows[0].properties_reg });
  } catch (e) {
    res.status(500).json({ error: e.message, code: e.code });
  }
});

// Mount your existing routes
app.use(urlRouter);

// Mount properties under /properties
app.use("/properties", propertyRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
