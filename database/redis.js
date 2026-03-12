import { createClient } from "@redis/client";
import { pool } from "./postgresql.js";
export const redisClient = await createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD

})

export async function initRedis() {
    try {
        await redisClient.connect()
    } catch (error) {
        console.error("Failed to initialize connection to redis.")
        process.exit(2)
    }
    redisClient.on("error", (error) => {
        console.error("redisClient error")
        pool.end()
        process.exit(2)
    })
}