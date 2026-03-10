
import { findAll, findById, create } from "../models/propertyModel.js";


export async function getAllProperties(req, res) {
    try {
        const properties = await findAll() 
        res.status(200).json(properties)   
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch properties" })
    }
}


export async function getPropertyById(req, res) {
    try {
        const id = Number(req.params.id)

       
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid property ID" })
        }

        const property = await findById(id)

        
        if (!property) {
            return res.status(404).json({ error: "Property not found" })
        }

        res.status(200).json(property)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch property" })
    }
}


export async function createProperty(req, res) {
    try {
        const {
            seller_id,
            type,
            location,
            area,
            floors,
            rooms,
            bathrooms,
            city,
            district,
            description,
            price
        } = req.body

        
        const required = { seller_id, type, location, area, floors, rooms, bathrooms, city, district, price }
        const missing = Object.keys(required).filter(k => required[k] == null || required[k] === "")

        if (missing.length > 0) {
            return res.status(400).json({ 
                error: "Missing required fields", 
                fields: missing 
            })
        }

        const property = await create(
            seller_id, type, location, area, floors,
            rooms, bathrooms, city, district, description || null, price
        )

        
        res.status(201).json(property)

    } catch (error) {
        console.error(error)

        
        if (error.code === '23503') { 
            return res.status(422).json({ error: "seller_id does not exist in users table" })
        }
        if (error.code === '23514') { 
            return res.status(422).json({ error: "Invalid values — check area, price, rooms etc. are positive" })
        }

        res.status(500).json({ error: "Failed to create property" })
    }
}