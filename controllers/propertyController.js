import {
    getAllProperties,
    getPropertyById,
    createProperty
} from "../services/propertyServices.js"
import { search } from "../models/propertyModel.js";
import { mapPropertiesLocationNames } from "../services/locationCache.js";

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
        if (Number.isNaN(id)) {
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
        const property = await createProperty(req.session.userID, req.body)
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

export async function searchForProperty(req, res) {
    try {
        const { page, orderBy, orderDirection, ...filters } = req.updatedParameters

        let result = await search(page, orderBy, orderDirection, filters)
        res.status(200).json(mapPropertiesLocationNames(result))
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch properties" })
    }
}