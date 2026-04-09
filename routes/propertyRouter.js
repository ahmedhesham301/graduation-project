

import { Router } from "express"
import { getAll, getOne, create } from "../controllers/propertyController.js"
import { validatePropertyBody } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified } from "../middlewares/propertyAuth.js"
import { searchForProperty } from "../controllers/propertyController.js";
import { validateSearchQuery } from "../middlewares/validation/searchValidator.js";
const router = Router()


router.get("/properties", getAll)
router.get("/properties:id", getOne)
router.get('/search', validateSearchQuery, searchForProperty)

router.post("/properties", isAuthenticated, isSellerVerified, validatePropertyBody, create)

export default router