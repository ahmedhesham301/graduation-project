import { Router } from "express"
import {
    getMyFavorites,
    saveToFavorites
    
} from "../controllers/savedController.js"
import { validatePropertyId } from "../middlewares/validation/savedValidator.js"
import { isAuthenticated } from "../middlewares/session.js"

const router = Router()

router.use(isAuthenticated)



router.get("/", getMyFavorites)
router.post("/:propertyId", validatePropertyId, saveToFavorites)


export default router