

import { Router } from "express"
import { getPropertyByIdHandler, create } from "../controllers/propertyController.js"
import { validatePropertyBody } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified } from "../middlewares/propertyAuth.js"
import { searchForProperty } from "../controllers/propertyController.js";
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
import { resolveLocationNamesToIds } from "../middlewares/searchLocationResolver.js";
const router = Router()


router.get("/properties/:id", getPropertyByIdHandler)
router.get('/search', validateSearchQuery, resolveLocationNamesToIds, searchForProperty)

router.post("/properties", isAuthenticated, isSellerVerified, validatePropertyBody, create)

export default router