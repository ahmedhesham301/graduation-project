import { cityIdByName, districtIdByName } from "../services/locationCache.js";

export async function resolveLocationNamesToIds(req, res, next) {
    if (req.updatedParameters.city) {
        req.updatedParameters.city = cityIdByName[req.updatedParameters.city]
        if (!req.updatedParameters.city){
            res.status(404).json({message:"city not found"})
            return
        }
    }
    if (req.updatedParameters.district) {
        req.updatedParameters.district = districtIdByName[req.updatedParameters.district]
        if (!req.updatedParameters.district) {
            res.status(404).json({message:"district not found"})
            return
        }
    }
    next()
}