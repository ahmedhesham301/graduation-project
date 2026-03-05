import { save } from "../models/usersModel.js";

export async function register(req, res) {
    try {        
        await save(req.body.fullName, req.body.email, req.body.phone, req.body.password, "buyer")
        res.status(200).json({ message:"User registered successfully"})
    } catch (error) {
        res.status(500).json({ error: error.message })
        console.error(error)
    }
}