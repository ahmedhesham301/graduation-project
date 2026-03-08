import express from 'express'
import morgan from 'morgan'
import { initDB } from "./database/postgresql.js";
import urlRouter from "./routes/usersRouter.js";

await initDB()

const app = express()

app.use(morgan('dev'))
app.use(express.json());

app.use(urlRouter)

app.listen(8080, '0.0.0.0')