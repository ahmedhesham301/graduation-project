import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
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
import { createMessage } from "./models/chatModel.js";
import { s3Init } from "./s3/s3.js";
import helmet from "helmet";
import cors from "cors";
import { healthCheck } from "./controllers/healthCheck.js";

// -----------------------------------------------------------
// Socket.io setup (uses the same HTTP server as Express)
// -----------------------------------------------------------
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

await initDB();
await initRedis();
await initRateLimiters();
await s3Init();

const app = express();
app.use(helmet());

if (process.env.ENV === "dev") {
    app.use(morgan('dev'));
}
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

// ------------------------ SOCKET.IO LOGIC ------------------------
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: { origin: ["http://localhost:5173"], credentials: true }
});

function getRoomId(senderId, receiverId, propertyId) {
    return [senderId, receiverId].sort().join('_') + '_' + propertyId;
}

io.on('connection', (socket) => {
    console.log('🔌 New socket:', socket.id);

    socket.on('join_chat', ({ senderId, receiverId, propertyId }) => {
        const roomId = getRoomId(senderId, receiverId, propertyId);
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async ({ senderId, receiverId, propertyId, content }) => {
        const roomId = getRoomId(senderId, receiverId, propertyId);
        try {
            const savedMessage = await createMessage(senderId, receiverId, propertyId, content);
            io.to(roomId).emit('receive_message', savedMessage);
        } catch (err) {
            console.error('Error saving chat message:', err);
            socket.emit('error_message', { err: 'Failed to store message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id);
    });
});

// -----------------------------------------------------------
// Start server (listen on HTTP server so socket.io works)
// -----------------------------------------------------------
httpServer.listen(8080, '0.0.0.0', () => {
    console.log('🚀 Server running on http://0.0.0.0:8080/api');
});
