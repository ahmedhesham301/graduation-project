import { createApp } from "./app.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createMessage } from "./models/chatModel.js";
import morgan from "morgan";

const app = await createApp();

if (process.env.ENV === "dev") {
    app.use(morgan('dev'));
}

// -----------------------------------------------------------
// Socket.io setup (uses the same HTTP server as Express)
// -----------------------------------------------------------
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: { origin: ["http://localhost:5173"], credentials: true }
});

function getRoomId(senderId, receiverId, propertyId) {
    return [senderId, receiverId].sort().join('_') + '_' + propertyId;
}

io.on('connection', (socket) => {
    console.log('New socket:', socket.id);

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
        console.log('Socket disconnected:', socket.id);
    });
});

// -----------------------------------------------------------
// Start server (listen on HTTP server so socket.io works)
// -----------------------------------------------------------
httpServer.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080/api');
});
