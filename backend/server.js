import { createApp } from "./app.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createMessage } from "./models/chatModel.js";
import { createNotification } from "./models/notificationModel.js";
import { pool } from "./database/postgresql.js";
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

// Map userId -> Set of socketIds for targeted notifications
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('New socket:', socket.id);

    socket.on('register_user', (userId) => {
        socket.userId = userId;
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
    });

    socket.on('join_chat', ({ senderId, receiverId, propertyId }) => {
        const roomId = getRoomId(senderId, receiverId, propertyId);
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async ({ senderId, receiverId, propertyId, content }) => {
        if (senderId === receiverId) {
            socket.emit('error_message', { err: 'Cannot send a message to yourself' });
            return;
        }
        const roomId = getRoomId(senderId, receiverId, propertyId);
        try {
            const savedMessage = await createMessage(senderId, receiverId, propertyId, content);
            io.to(roomId).emit('receive_message', savedMessage);

            // Create in-app notification
            try {
                const senderResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [senderId]);
                const senderName = senderResult.rows[0]?.full_name || 'Someone';
                const propResult = await pool.query('SELECT description FROM properties WHERE id = $1', [propertyId]);
                const propertyTitle = propResult.rows[0]?.description || 'a property';

                const notification = await createNotification(
                    receiverId,
                    'new_message',
                    `New message from ${senderName} about "${propertyTitle}"`,
                    content.length > 100 ? content.substring(0, 100) + '...' : content,
                    propertyId,
                    senderId
                );

                // Emit real-time notification to receiver if online
                const receiverSockets = userSockets.get(receiverId);
                if (receiverSockets) {
                    for (const sid of receiverSockets) {
                        io.to(sid).emit('new_notification', notification);
                    }
                }
            } catch (notifErr) {
                console.error('Error creating notification:', notifErr);
            }
        } catch (err) {
            console.error('Error saving chat message:', err);
            socket.emit('error_message', { err: 'Failed to store message' });
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId && userSockets.has(socket.userId)) {
            userSockets.get(socket.userId).delete(socket.id);
            if (userSockets.get(socket.userId).size === 0) {
                userSockets.delete(socket.userId);
            }
        }
        console.log('Socket disconnected:', socket.id);
    });
});

// -----------------------------------------------------------
// Start server (listen on HTTP server so socket.io works)
// -----------------------------------------------------------
httpServer.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080/api');
});
