
import { findAll, findById, create } from "../models/propertyModel.js"

export async function getAllProperties() {
    return await findAll()
}

export async function getPropertyById(id) {
    return await findById(id)
}


export async function createProperty(sellerId, propertyData) {
    const {
        type, coordinates, area, floors, rooms,
        bathrooms, cityID, areaID, description, price
    } = propertyData

    return await create(
        sellerId, type, coordinates, area, floors,
        rooms, bathrooms, cityID, areaID, description || null, price
    )
}