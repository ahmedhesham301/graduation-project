

import { Router } from "express"
import { getAll, getOne, create } from "../controllers/propertycontroller.js"
import { validatePropertyBody } from "../middlewares/validation/propertyValidator.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified } from "../middlewares/propertyAuth.js"

const router = Router()


router.get("/", getAll)
router.get("/:id", getOne)


router.post("/", isAuthenticated, isSellerVerified, validatePropertyBody, create)

export default router