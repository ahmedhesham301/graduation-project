import { Router } from "express"
import { getCities } from "../controllers/locationController.js"

const router = Router()

// Public — no auth needed to browse cities
router.get("/cities", getCities)

export default router