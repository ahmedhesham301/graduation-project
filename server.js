import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { initDB } from "./database/postgresql.js"
import { initRedis } from "./database/redis.js"
import { sessionMiddleware } from "./middlewares/session.js";
import authRouter from "./routes/authRouter.js"
import propertyRouter from "./routes/propertyRouter.js"

await initDB()
await initRedis()

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(sessionMiddleware)

app.use('/properties', propertyRouter)
app.use(authRouter)

app.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080')
})