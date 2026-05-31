import 'dotenv/config';
import express from 'express';
import { initDB } from "./database/postgresql.js";
import { initRedis } from "./database/redis.js";
import { initRateLimiters } from "./middlewares/rateLimiter.js";
import { sessionMiddleware } from "./middlewares/session.js";
import authRouter from "./routes/authRouter.js";
import propertyRouter from "./routes/propertyRouter.js";
import savedRouter from "./routes/savedRouter.js";
import locationRouter from "./routes/locationRouter.js";
import chatBotRouter from "./routes/chatBotRouter.js";
import userRouter from "./routes/userRouter.js";
import analyticsRouter from "./routes/analyticsRouter.js";
import chatRouter from "./routes/chatRouter.js";
import adminRouter from "./routes/adminRouter.js";
import offerRouter from "./routes/offerRouter.js";
import { s3Init } from "./s3/s3.js";
import helmet from "helmet";
import cors from "cors";
import { healthCheck } from "./controllers/healthCheck.js";

export async function createApp() {
    await initDB();
    if (process.env.NODE_ENV !== 'test') {
        await initRedis();
        await initRateLimiters();
        await s3Init();
    }

    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use(cors({
        origin: ["http://localhost:5173"],
        credentials: true
    }));
    app.use(sessionMiddleware);

    app.use('/api/health', healthCheck);
    app.use('/api', authRouter);
    app.use('/api', propertyRouter);
    app.use('/api/favorites', savedRouter);
    app.use('/api', locationRouter);
    app.use('/api', chatBotRouter);
    app.use('/api', userRouter);
    app.use('/api', analyticsRouter);
    app.use('/api', chatRouter);
    app.use('/api', adminRouter);
    app.use('/api', offerRouter);

    return app;
}
