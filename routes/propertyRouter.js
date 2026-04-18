

import { Router } from "express"
import { getPropertyByIdHandler, create, deleteProperty } from "../controllers/propertyController.js"
import { validatePropertyBody, validatePropertyId } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified, isPropertyOwner } from "../middlewares/propertyAuth.js"
import { searchForProperty } from "../controllers/propertyController.js";
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
import { resolveLocationNamesToIds } from "../middlewares/searchLocationResolver.js";
const router = Router()


router.get("/properties/:id", validatePropertyId, getPropertyByIdHandler)
router.get('/search', validateSearchQuery, resolveLocationNamesToIds, searchForProperty)

router.post("/properties", isAuthenticated, isSellerVerified, validatePropertyBody, create)

router.delete("/properties/:id", isAuthenticated, isSellerVerified, validatePropertyId, isPropertyOwner, deleteProperty)
export default router