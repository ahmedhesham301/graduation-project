
import { findById } from "../models/userModel.js"

export async function isSellerVerified(req, res, next) {
    try {
        const user = await findById(req.session.userID)

        if (!user) {
            return res.status(401).json({ error: "User no longer exists" })
        }

        if (user.role !== 'seller') {
            return res.status(403).json({ error: "Only sellers can create properties" })
        }

        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}