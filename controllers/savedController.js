import {
    addToFavorites,
     getFavorites
} from "../services/savedServices.js"

export async function getMyFavorites(req, res) {
    try {
        const favorites = await getFavorites(req.session.userID)
        res.status(200).json(favorites)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch favorites" })
    }
}
export async function saveToFavorites(req, res) {
    try {
        const { saved, alreadySaved } = await addToFavorites(
            req.session.userID,
            req.params.propertyId
        )

        if (alreadySaved) {
            return res.status(200).json({ message: "Property already in favorites" })
        }

        res.status(201).json({ message: "Property saved to favorites", saved })
    } catch (error) {
        console.error(error)
        
        if (error.code === '23503') {
            return res.status(404).json({ error: "Property not found" })
        }
        res.status(500).json({ error: "Failed to save property" })
    }
}