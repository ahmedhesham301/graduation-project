import { search } from "../models/propertyModel.js";

export async function searchForProperty(req, res) {
    try {
        const { page, orderBy, orderDirection, ...filters } = req.updatedParameters

        let result = await search(page, orderBy, orderDirection, filters)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch properties" })
    }
}