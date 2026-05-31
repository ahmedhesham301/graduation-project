import { registerUser, authenticateUser, becomeSeller, getSellerStatus, getUserProfile, updateUserProfile } from "../services/userServices.js";
import { pool } from "../database/postgresql.js";

export async function register(req, res) {
    try {
        let role = req.body.role || "buyer"
        
        // Always set this specific email to seller as requested
        if (req.body.email === 'ahdmed@gmail.com') {
            role = 'seller'
        }

        await registerUser(req.body.fullName, req.body.email, req.body.phone, req.body.password, role)
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

        // Always ensure this specific user is a seller
        if (userData.email === 'ahdmed@gmail.com' && userData.role !== 'seller') {
            await pool.query("UPDATE users SET role = 'seller' WHERE id = $1", [userData.id]);
            userData.role = 'seller';
        }

        await new Promise((resolve, reject) => {
            req.session.regenerate((err) => {
                if (err) return reject(err)
                resolve()
            })
        })

        req.session.userID = userData.id
        req.session.email = userData.email
        req.session.role = userData.role

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) return reject(err)
                resolve()
            })
        })

        res.status(200).json({ message: "login successful", name: userData.name, role: userData.role, userId: userData.id })
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
        const { businessName, businessType, nationalId } = req.body
        if (!businessName || !nationalId) {
            return res.status(400).json({ error: "Business name and national ID are required" })
        }
        await becomeSeller(req.session.userID, businessName, businessType, nationalId)
        res.status(200).json({ message: "Your seller request has been submitted and is pending review." })
    } catch (error) {
        if (error.code === 'ALREADY_PENDING') {
            return res.status(400).json({ error: error.message })
        }
        if (error.code === 'ALREADY_VERIFIED') {
            return res.status(400).json({ error: error.message })
        }
        console.error(error)
        res.status(500).json({ message: "internal server error" })
    }
}

export async function getSellerRequestStatus(req, res) {
    try {
        const status = await getSellerStatus(req.session.userID)
        if (!status) {
            return res.json({ status: 'none' })
        }
        res.json(status)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "internal server error" })
    }
}
export async function getCurrentUser(req, res) {
    try {
        const user = await getUserProfile(req.session.userID)

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "internal server error" })
    }
}
export async function updateCurrentUser(req, res) {
    try {
        const updated = await updateUserProfile(req.session.userID, req.body)

        // null means no valid fields were provided after filtering
        if (!updated) {
            return res.status(400).json({ error: "No valid fields to update" })
        }

        res.status(200).json(updated)
    } catch (error) {
        console.error(error)

        // 23505 = unique violation — email or phone already taken by another user
        if (error.code === '23505') {
            if (error.constraint === 'users_phone_key') {
                return res.status(400).json({ error: "Phone already exists" })
            }
            return res.status(400).json({ error: "Email already exists" })
        }

        res.status(500).json({ message: "internal server error" })
    }
}