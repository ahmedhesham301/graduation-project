
import {
    saveProperty,
    getSavedProperties
} from "../models/savedModel.js"
import { mapPropertiesLocationNames } from "./locationCache.js"


export async function addToFavorites(userId, propertyId) {
    const saved = await saveProperty(userId, propertyId)
    
    return { saved, alreadySaved: saved === null }
}
export async function getFavorites(userId) {
    const rows = await getSavedProperties(userId)
   
    return mapPropertiesLocationNames(rows)
}
export async function removeFromFavorites(userId, propertyId) {
    return await removeSavedProperty(userId, propertyId)
}