import { getCities, getDistricts } from "../models/locationModel.js";

export const cityNameById = {};
export const cityIdByName = {};
export const districtNameById = {};
export const districtIdByName = {};

export async function initializeLocationCache() {
    try {
        const cityRows = await getCities()
        populateLocationLookups(cityIdByName, cityNameById, cityRows)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }

    try {
        const districtRows = await getDistricts()
        populateLocationLookups(districtIdByName, districtNameById, districtRows)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


function populateLocationLookups(locationIdByName, locationNameById, locationRows) {
    locationRows.forEach(locationRow => {
        locationNameById[locationRow['id']] = locationRow['name']
        locationIdByName[locationRow['name']] = locationRow['id']
    });
}
