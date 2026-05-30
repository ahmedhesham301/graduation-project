import { afterAll } from 'vitest';
import { pool } from '../database/postgresql.js';

afterAll(async () => {
    await pool.end();
});
