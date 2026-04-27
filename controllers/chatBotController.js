import { callChatBotService } from "../services/chatBotService.js";

export async function getRecommendation(req, res) {
    try {
        let response = await callChatBotService(req.body.message)
        res.status(200).json(response)
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" })
    }
}