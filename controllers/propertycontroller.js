

import {
    getAllProperties,
    getPropertyById,
    createProperty
} from "../services/propertyServices.js"


export async function getAll(req, res) {
    try {
        const properties = await getAllProperties()
        res.status(200).json(properties)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch properties" })
    }
}


export async function getOne(req, res) {
    try {
        const id = Number(req.params.id)
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid property ID" })
        }

        const property = await getPropertyById(id)
        if (!property) {
            return res.status(404).json({ error: "Property not found" })
        }

        res.status(200).json(property)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch property" })
    }
}


export async function create(req, res) {
    try {
        const property = await createProperty(req.seller_id, req.body)
        res.status(201).json(property)
    } catch (error) {
        console.error(error)
        if (error.code === '23503') {
            return res.status(422).json({ error: "seller_id does not exist" })
        }
        if (error.code === '23514') {
            return res.status(422).json({ error: "Invalid values — check area, price, rooms are positive" })
        }
        res.status(500).json({ error: "Failed to create property" })
    }
}