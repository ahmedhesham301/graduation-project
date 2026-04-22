import { findPropertyById, createPropertyRecord } from "../models/propertyModel.js"
import { mapPropertyLocationNames } from "../services/locationCache.js";



export async function getPropertyById(propertyId) {
    const propertyRecord = await findPropertyById(propertyId)
    if (!propertyRecord) return null;

    const { deleted_at: deletedAt, ...propertyWithLocation } = mapPropertyLocationNames(propertyRecord)

    const isAvailable = !deletedAt

    return {
        ...propertyWithLocation,
        available: isAvailable
    }
}


export async function createProperty(sellerId, propertyData) {
    const {
        type,
        lat,
        lon,
        area,
        floors,
        rooms,
        bathrooms, cityID, districtID, description, price
    } = propertyData

    return await createPropertyRecord(
        sellerId, type, lat, lon, area, floors,
        rooms, bathrooms, cityID, districtID, description || null, price
    )
}
