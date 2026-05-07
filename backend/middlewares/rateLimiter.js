import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { redisClient } from "../database/redis.js"

function makeRedisStore(prefix) {
    return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix
    })
}

function makeLimiter(windowMs, max, prefix, message, skipSuccessful = false) {
    let limiter = null

    // Return middleware function that lazily initializes the limiter
    return (req, res, next) => {
        if (!limiter) {
            limiter = rateLimit({
                windowMs,
                max,
                standardHeaders: "draft-8",
                legacyHeaders: false,
                store: makeRedisStore(prefix),
                skipSuccessfulRequests: skipSuccessful,
                message: { error: message }
            })
        }
        limiter(req, res, next)
    }
}

export const authLimiter = makeLimiter(
    15 * 60 * 1000,
    5,
    "rl:auth:",
    "Too many login attempts. Please try again in 15 minutes.",
    true
)

export const propertyLimiter = makeLimiter(
    60 * 60 * 1000,
    20,
    "rl:property:",
    "Too many property listings created. Please try again in an hour."
)
