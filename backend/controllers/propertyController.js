import {
    getPropertyById,
    createProperty
} from "../services/propertyServices.js"
import { search, deletePropertyById, getTypes } from "../models/propertyModel.js";
import { preparePropertyMediaUploads, getMediaUrls } from "../services/propertyMediaService.js";


export async function getPropertyByIdHandler(req, res) {
    try {
        const property = await getPropertyById(req.params.propertyId)
        if (!property) {
            return res.status(404).json({ error: "Property not found" })
        }

        const urls = await getMediaUrls(req.params.propertyId)
        res.status(200).json({ ...property, media: urls })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}


export async function create(req, res) {
    try {
        const property = await createProperty(req.session.userID, req.body)
        const preparedUploads = await preparePropertyMediaUploads(property.id, req.body.media)
        const uploadUrlsByFileName = {}

        for (const uploadDescriptor of preparedUploads) {
            uploadUrlsByFileName[uploadDescriptor.fileName] = {
                uploadUrl: uploadDescriptor.presignedUrl,
                mediaId: uploadDescriptor.objectKey
            }
        }

        res.status(201).json({ id: property.id, media: uploadUrlsByFileName })
    } catch (error) {
        if (error.code === '23503') {
            return res.status(422).json({ error: "seller_id does not exist" })
        }
        else if (error.code === '23502' && error.column === 'type_id') {
            return res.status(422).json({ error: "Invalid property type2" })
        }
        else if (error.code === '22P02' && error.routine === 'enum_in') {
            return res.status(422).json({ error: "Invalid condition" })
        }

        console.log(error);
        res.status(500).json({ error: "Internal server error" })
    }
}

export async function searchForProperty(req, res) {
    try {
        const { page, orderBy, orderDirection, city = null, district = null, minPrice = null, maxPrice = null, ...filters } = req.updatedParameters

        let result = await search(page, orderBy, orderDirection, city, district, minPrice, maxPrice, filters)
        res.status(200).json(result)
    } catch (error) {
        if (error.code === '22P02' && error.routine === 'enum_in'){
            return res.status(200).json([])
        }
        console.log(error);
        res.status(500).json({ error: "Internal server error" })
    }
}

export async function deleteProperty(req, res) {
    try {
        const result = await deletePropertyById(req.params.propertyId)
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Property not found" })
        }

        res.status(204).send()

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}

import { getNearbyProperties } from "../services/propertyServices.js"
export async function getNearby(req, res) {
    try {
        const { lat, lon, radius, page } = req.updatedParameters
        const properties = await getNearbyProperties(lat, lon, radius, page)
        res.status(200).json(properties)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}


export async function getPropertyTypes(req, res) {
    try {
        const types = await getTypes()
        res.status(200).json(types)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}