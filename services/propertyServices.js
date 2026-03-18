
import { findAll, findById, create } from "../models/propertyModel.js"

export async function getAllProperties() {
    return await findAll()
}

export async function getPropertyById(id) {
    return await findById(id)
}


export async function createProperty(sellerId, propertyData) {
    const {
        type, location, area, floors, rooms,
        bathrooms, city, district, description, price
    } = propertyData

    return await create(
        sellerId, type, location, area, floors,
        rooms, bathrooms, city, district, description || null, price
    )
}