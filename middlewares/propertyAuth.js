
import { findById } from "../models/userModel.js"
import { findPropertyById } from "../models/propertyModel.js"

export async function isSellerVerified(req, res, next) {
    try {
        const user = await findById(req.session.userID)

        if (!user) {
            return res.status(401).json({ error: "User no longer exists" })
        }

        if (user.role !== 'seller') {
            return res.status(403).json({ error: "Only sellers can manage properties" })
        }

        next()
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}

export async function isPropertyOwner(req, res, next) {
    try {
        const property = await findPropertyById(req.params.id)
        if (property == null) return res.status(404).send()
        if (property.seller_id == req.session.userID) {
            next()
        }
        else {
            return res.status(404).send()
        } 
        
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}
