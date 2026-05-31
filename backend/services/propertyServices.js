import {
    findPropertyById,
    createPropertyRecord,
    findPropertiesNearby,
    updatePropertyRecord
} from "../models/propertyModel.js"
import { recordPropertyContact } from "../models/analyticsModel.js"

export async function getPropertyById(propertyId) {
    const propertyRecord = await findPropertyById(propertyId, false)
    if (!propertyRecord) return null;

    const { deleted_at: deletedAt, sold_at: soldAt, ...propertyData } = propertyRecord

    const isAvailable = !deletedAt && !soldAt

    return {
        ...propertyData,
        available: isAvailable,
        sold_at: soldAt
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

export async function updateProperty(propertyId, propertyData) {
    // The model owns the DB transaction because it must update the property
    // and insert price history as one atomic operation.
    return await updatePropertyRecord(propertyId, propertyData)
}

export async function contactPropertySeller(propertyId, userId, contactSessionId, contactMethod) {
    const property = await getPropertyById(propertyId)
    if (!property) return null
    
    if (userId && property.seller_id === userId) {
        return { is_self: true }
    }

    await recordPropertyContact(propertyId, userId, contactSessionId, contactMethod)

    return {
        property_id: property.id,
        seller_name: property.seller_name,
        seller_email: property.seller_email,
        seller_phone: property.seller_phone,
        contact_method: contactMethod
    }
}

export async function getNearbyProperties(lat, lon, radiusKm, page) {
    const radiusMeters = radiusKm * 1000
    return await findPropertiesNearby(lat, lon, radiusMeters, page)
}
