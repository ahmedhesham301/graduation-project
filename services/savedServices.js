
import {
    saveProperty,
    getSavedProperties
} from "../models/savedModel.js"


export async function addToFavorites(userId, propertyId) {
    const saved = await saveProperty(userId, propertyId)
    
    return { saved, alreadySaved: saved === null }
}
export async function getFavorites(userId) {
    const rows = await getSavedProperties(userId)
   
    return rows
}
export async function removeFromFavorites(userId, propertyId) {
    return await removeSavedProperty(userId, propertyId)
    return rows
}