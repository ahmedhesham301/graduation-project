import express from 'express'
import morgan from 'morgan'
import { initDB } from "./database/postgresql.js";

await initDB()

const app = express()
app.use(morgan('dev'))
app.listen(8080, '0.0.0.0')