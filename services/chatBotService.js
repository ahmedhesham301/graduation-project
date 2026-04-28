import axios from "axios";
import { callChatBot } from "../gemini/gemini.ts";



export async function callChatBotService(userMessage) {
    let response = await callChatBot(userMessage)
    console.log(response);
    
    if (!response.callSearch) {
        return { message: response.question }
    }

    const { callSearch, whyIsCallSearch, question, ...filters } = response

    let searchResponse = await axios.get("http://localhost:8080/api/search", {params: {page: 1, ...filters}})
    return (searchResponse.data)
    
}