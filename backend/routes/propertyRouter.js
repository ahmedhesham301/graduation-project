

import { Router } from "express"
import {
    getPropertyByIdHandler, create,
    update, contactSeller, deleteProperty, searchForProperty,
    getNearby, getPropertyTypes, getPropertyTourHandler,
    downloadTourZipHandler,
    getMyProperties, deleteMedia, addMedia,
    saveDraft, publishDraftHandler
} from "../controllers/propertyController.js"
import {
    validatePropertyBody,
    validatePropertyPatchBody,
    validatePropertyContactBody,
    validatePropertyId,
    validateMediaId
} from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified, isPropertyOwner } from "../middlewares/propertyAuth.js"
import { propertyLimiter } from "../middlewares/rateLimiter.js"
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
import { verifyUpload } from "../controllers/propertyMediaController.js";
import { validateNearbyQuery } from "../middlewares/validation/nearbyValidator.js"
import { trackPropertyView } from "../middlewares/trackPropertyView.js"
const router = Router()

router.get('/properties/nearby', validateNearbyQuery, getNearby)
router.get('/properties/types', getPropertyTypes)
router.get('/my-properties', isAuthenticated, isSellerVerified, getMyProperties)
router.get("/properties/:propertyId", validatePropertyId, trackPropertyView, getPropertyByIdHandler)
router.get("/properties/:propertyId/tour", validatePropertyId, getPropertyTourHandler)
router.get("/properties/:propertyId/tour/download", validatePropertyId, downloadTourZipHandler)
router.get('/search', validateSearchQuery, searchForProperty)

router.post("/properties", propertyLimiter, isAuthenticated, isSellerVerified, validatePropertyBody, create)
router.post("/properties/:propertyId/contact", validatePropertyId, validatePropertyContactBody, contactSeller)
router.post("/properties/:propertyId/media", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, addMedia)

router.post("/drafts", isAuthenticated, isSellerVerified, saveDraft)
router.put("/drafts/:draftId", isAuthenticated, isSellerVerified, saveDraft)
router.post("/drafts/:draftId/publish", isAuthenticated, isSellerVerified, publishDraftHandler)

router.patch("/properties/:propertyId", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, validatePropertyPatchBody, update)

router.put("/properties/:propertyId/media/:mediaId", isAuthenticated, validateMediaId, isSellerVerified, isPropertyOwner, verifyUpload)

router.delete("/properties/:propertyId", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, deleteProperty)
router.delete("/properties/:propertyId/media/:mediaKey", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, deleteMedia)

export default router
