import { registerUser, authenticateUser, becomeSeller } from "../services/userServices.js";

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

        await req.session.regenerate(function (err) {
            if (err) {
                res.status(500).json({ message: "internal server error" })
                console.error(err)
            }
        })

        req.session.userID = userData.id
        req.session.email = userData.email
        req.session.role = userData.role

        res.status(200).json({ message: "login successful", name: userData.name })
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

export async function logout(req, res) {
    req.session.destroy(function (err) {
        if (err) {
            res.status(500).json({ message: "internal server error" })
            console.error(err)
            return
        }
        res.status(200).json({ message: "logout successful" })
    })
}

export async function upgradeTOSeller(req, res) {
    try {
        await becomeSeller(req.session.userID)


        req.session.role = 'seller'

        res.status(200).json({ message: "You are now registered as a seller. Your profile is pending verification." })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "internal server error" })
    }
}