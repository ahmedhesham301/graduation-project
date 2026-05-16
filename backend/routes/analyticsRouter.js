import { Router } from "express"
import { getAnalytics, getSellerPerformance } from "../controllers/analyticsController.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified } from "../middlewares/propertyAuth.js"

const router = Router()

// Both middlewares required:
// isAuthenticated → must be logged in
// isSellerVerified → must have role='seller'
router.get("/seller/analytics", isAuthenticated, isSellerVerified, getAnalytics)
router.get("/analytics/seller-performance", isAuthenticated, isSellerVerified, getSellerPerformance)

export default router
