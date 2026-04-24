

import { Router } from "express"
import { getPropertyByIdHandler, create, deleteProperty } from "../controllers/propertyController.js"
import { validatePropertyBody, validatePropertyId, validateMediaId } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified, isPropertyOwner } from "../middlewares/propertyAuth.js"
import { searchForProperty } from "../controllers/propertyController.js";
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
import { resolveLocationNamesToIds } from "../middlewares/searchLocationResolver.js";
import { verifyUpload } from "../controllers/propertyMediaController.js";
const router = Router()


router.get("/properties/:propertyId", validatePropertyId, getPropertyByIdHandler)
router.get('/search', validateSearchQuery, resolveLocationNamesToIds, searchForProperty)

router.post("/properties", isAuthenticated, isSellerVerified, validatePropertyBody, create)

router.put("/properties/:propertyId/media/:mediaId", isAuthenticated, validateMediaId, isSellerVerified, isPropertyOwner, verifyUpload)

router.delete("/properties/:propertyId", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, deleteProperty)
export default router
