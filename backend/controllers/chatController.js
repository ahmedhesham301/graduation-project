import { getInbox, createMessage, getConversation } from "../models/chatModel.js";

export async function getInboxHandler(req, res) {
    try {
        const inbox = await getInbox(req.session.userID)
        res.json({ inbox })
    } catch (err) {
        console.error("GET /api/chat/inbox error:", err)
        res.status(500).json({ error: "Failed to load inbox" })
    }
}

export async function createMessageHandler(req, res) {
    const { propertyId, receiverId, content } = req.body
    const senderId = req.session.userID

    if (!propertyId || !receiverId || !content) {
        return res.status(400).json({ error: "Missing required fields" })
    }

    try {
        const message = await createMessage(senderId, receiverId, propertyId, content)
        res.status(201).json({ id: message.id, createdAt: message.createdAt })
    } catch (err) {
        console.error("POST /api/chat/messages error:", err)
        res.status(500).json({ error: "Failed to send message" })
    }
}

export async function getConversationHandler(req, res) {
    const { propertyId, userId1, userId2 } = req.params
    const roomId = [userId1, userId2].sort().join("_") + "_" + propertyId

    try {
        const messages = await getConversation(propertyId, userId1, userId2)
        res.json({ roomId, messages })
    } catch (err) {
        console.error("GET /api/chat error:", err)
        res.status(500).json({ error: "Failed to load chat history" })
    }
}
