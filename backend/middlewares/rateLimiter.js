import { rateLimit, ipKeyGenerator } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { redisClient } from "../database/redis.js"

let authLimiterImpl = (req, res, next) => next()
let propertyLimiterImpl = (req, res, next) => next()
let generalLimiterImpl = (req, res, next) => next()

function makeStore(prefix) {
    return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix
    })
}

export const authLimiter = (req, res, next) => authLimiterImpl(req, res, next)
export const propertyLimiter = (req, res, next) => propertyLimiterImpl(req, res, next)
export const generalLimiter = (req, res, next) => generalLimiterImpl(req, res, next)

export async function initRateLimiters() {
    authLimiterImpl = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        store: makeStore("rl:auth:"),
        skipSuccessfulRequests: true,
        message: { error: "Too many login attempts. Please try again in 15 minutes." }
    })

    propertyLimiterImpl = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 20,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        store: makeStore("rl:property:"),
        keyGenerator: (req) => {
            if (req.session?.userID) return `user:${req.session.userID}`
            return `ip:${ipKeyGenerator(req.ip)}`
        },
        message: { error: "Too many property listings created. Please try again in an hour." }
    })

    generalLimiterImpl = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        store: makeStore("rl:general:"),
        message: { error: "Too many requests. Please slow down." }
    })
}
