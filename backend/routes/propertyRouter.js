

import { Router } from "express"
import {
    getPropertyByIdHandler, create,
    deleteProperty, searchForProperty,
    getNearby, getPropertyTypes
} from "../controllers/propertyController.js"
import { validatePropertyBody, validatePropertyId, validateMediaId } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified, isPropertyOwner } from "../middlewares/propertyAuth.js"
import { propertyLimiter } from "../middlewares/rateLimiter.js"
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
import { verifyUpload } from "../controllers/propertyMediaController.js";
import { validateNearbyQuery } from "../middlewares/validation/nearbyValidator.js"
const router = Router()

router.get('/properties/nearby', validateNearbyQuery, getNearby)
router.get('/properties/types', getPropertyTypes)
router.get("/properties/:propertyId", validatePropertyId, getPropertyByIdHandler)
router.get('/search', validateSearchQuery, searchForProperty)


router.post("/properties", propertyLimiter, isAuthenticated, isSellerVerified, validatePropertyBody, create)

router.put("/properties/:propertyId/media/:mediaId", isAuthenticated, validateMediaId, isSellerVerified, isPropertyOwner, verifyUpload)

router.delete("/properties/:propertyId", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, deleteProperty)
export default router
