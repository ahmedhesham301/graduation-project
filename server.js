import 'dotenv/config'  
import express from 'express'
import morgan from 'morgan'
import { initDB } from "./database/postgresql.js"
import urlRouter from "./routes/usersRouter.js"
import propertyRouter from "./routes/propertyRouter.js"

await initDB()

const app = express()
app.use(morgan('dev'))
app.use(express.json())
app.use('/properties', propertyRouter)
app.use(urlRouter)

app.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080')
})