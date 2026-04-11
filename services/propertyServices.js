
import { findPropertyById, create } from "../models/propertyModel.js"
import { mapPropertyLocationNames } from "../services/locationCache.js";



export async function getPropertyById(id) {
    let property = await findPropertyById(id)
    if (!property) return null;

    return mapPropertyLocationNames(property)
}


export async function createProperty(sellerId, propertyData) {
    const {
        type, coordinates, area, floors, rooms,
        bathrooms, cityID, districtID, description, price
    } = propertyData

    return await create(
        sellerId, type, coordinates, area, floors,
        rooms, bathrooms, cityID, districtID, description || null, price
    )
}