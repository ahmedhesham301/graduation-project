import {
    getPropertyById,
    createProperty
} from "../services/propertyServices.js"
import { search, deletePropertyById } from "../models/propertyModel.js";
import { mapPropertiesLocationNames } from "../services/locationCache.js";
import { preparePropertyMediaUploads } from "../services/propertyMediaService.js";

export async function getPropertyByIdHandler(req, res) {
    try {
        const property = await getPropertyById(req.params.propertyId)
        if (!property) {
            return res.status(404).json({ error: "Property not found" })
        }

        res.status(200).json(property)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
}


export async function create(req, res) {
    try {
        const property = await createProperty(req.session.userID, req.body)
        const preparedUploads = await preparePropertyMediaUploads(property.id, req.body.media)
        const uploadUrlsByMimeTypeAndSize = {}


        for (const uploadDescriptor of preparedUploads) {
            uploadUrlsByMimeTypeAndSize[uploadDescriptor.mimeType] ??= {}
            uploadUrlsByMimeTypeAndSize[uploadDescriptor.mimeType][uploadDescriptor.fileSize] ??= []
            uploadUrlsByMimeTypeAndSize[uploadDescriptor.mimeType][uploadDescriptor.fileSize].push({
                presignedUrl: uploadDescriptor.presignedUrl,
                mediaId: uploadDescriptor.objectKey
            })
        }

        res.status(201).json({ id: property.id, ...uploadUrlsByMimeTypeAndSize })
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
