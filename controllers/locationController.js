import { findAllCities ,findDistrictsByCityName} from "../models/locationModel.js"

export async function getCities(req, res) {
    try {
        const cities = await findAllCities()
        res.status(200).json(cities)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch cities" })
    }
}
export async function getDistrictsByCityName(req, res) {
    try {
        const districts = await findDistrictsByCityName(req.params.cityName)
        res.status(200).json(districts)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch districts" })
    }
}