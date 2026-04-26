import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { initDB } from "./database/postgresql.js"
import { initRedis } from "./database/redis.js"
import { sessionMiddleware } from "./middlewares/session.js";
import authRouter from "./routes/authRouter.js"
import propertyRouter from "./routes/propertyRouter.js"
import savedRouter from "./routes/savedRouter.js"
import { s3Init } from "./s3/s3.js";
import helmet from "helmet";
import cors from "cors";

await initDB()
await initRedis()
await s3Init()

const app = express()
app.use(helmet())

if (process.env.ENV === "dev") {
    app.use(morgan('dev'))
}
app.use(express.json())
app.use(cors())
app.use(sessionMiddleware)

app.use('/api', authRouter)
app.use('/api', propertyRouter)
app.use('/api/favorites', savedRouter)

app.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080/api')
})