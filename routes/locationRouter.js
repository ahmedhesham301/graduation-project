import { Router } from "express"
import { getCities ,getDistrictsByCityName} from "../controllers/locationController.js"

const router = Router()

// Public — no auth needed to browse cities
router.get("/cities", getCities)
router.get("/cities/:cityName/districts", getDistrictsByCityName)

export default router