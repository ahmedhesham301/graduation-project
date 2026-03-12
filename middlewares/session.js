import { RedisStore } from "connect-redis"
import session from "express-session"
import { redisClient } from "../database/redis.js";

const redisStore = new RedisStore({
    client: redisClient,
    prefix: "sess:"
})

export const sessionMiddleware = session({
    store: redisStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 },
    name: "seid"
})


export async function isAuthenticated(req, res, next) {
    if (req.session.userID) {
        return next()
    }
    return res.status(401).json({ error: "Not authenticated" })
}