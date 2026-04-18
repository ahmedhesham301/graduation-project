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

export function mapPropertyLocationNames(row) {
    const { city_id, district_id, ...rest } = row;
    let city = cityNameById[city_id]
    let district = districtNameById[district_id]
    if (!city || !district) {
        throw new Error(
            `Failed to map property location names. city_id=${city_id} resolved_city=${city}, district_id=${district_id} resolved_district=${district}.`
        );
    }
    
    return {
        ...rest,
        city: city,
        district: district,
    };
}

export function mapPropertiesLocationNames(rows) {
    return rows.map(mapPropertyLocationNames);
}
