import { findPropertyById, createPropertyRecord, findPropertiesNearby } from "../models/propertyModel.js"

export async function getPropertyById(propertyId) {
    const propertyRecord = await findPropertyById(propertyId, false)
    if (!propertyRecord) return null;

    const { deleted_at: deletedAt, ...propertyRecordWithoutDeleted_at } = propertyRecord

    const isAvailable = !deletedAt

    return {
        ...propertyRecordWithoutDeleted_at,
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
        bathrooms, city, district, description, price, condition
    } = propertyData

    return await createPropertyRecord(
        sellerId, type, lat, lon, area, floors,
        rooms, bathrooms, city, district, description || null, price, condition
    )
}

export async function getNearbyProperties(lat, lon, radiusKm, page) {
    const radiusMeters = radiusKm * 1000
    return await findPropertiesNearby(lat, lon, radiusMeters, page)
}
