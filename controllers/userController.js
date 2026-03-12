import { save } from "../models/userModel.js";
import { registerUser, authenticateUser } from "../services/userServices.js";

export async function register(req, res) {
    try {
        await registerUser(req.body.fullName, req.body.email, req.body.phone, req.body.password, "buyer")
        res.status(201).json({ message: 'User registered successfully' })
    } catch (error) {
        console.log(error)
        if (error.code === '23505') {
            if (error.constraint === 'users_phone_key') {
                res.status(400).json({ error: 'Phone already exists' })
            } else {
                res.status(400).json({ error: 'Email already exists' })
            }
            return
        }
        else if (error.code == '22001') {
            res.status(400).json({ error: 'Input exceeds allowed length' })
            return
        }
        res.status(500).json({ message: "internal server error" })
        console.error(error)
    }
}

export async function login(req, res) {
    try {
        let userData = await authenticateUser(req.body.email, req.body.password)

        req.session.userID = userData.id
        req.session.email = userData.email
        req.session.role = userData.role

        res.status(200).json({ message: "login successful" })
    } catch (error) {
        if (error.code == "EMAIL_NOT_FOUND") {
            res.status(400).json({ error: 'Email not found' })
        }
        else if (error.code == "WRONG_PASSWORD") {
            res.status(400).json({ error: 'Invalid password' })
        }
        else {
            res.status(500).json({ message: "internal server error" })
            console.error(error)
        }
    }
}