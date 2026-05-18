import { Router } from "express"
import {
    getAnalytics,
    getPropertyAnalytics,
    getMarketTrends,
    getSellerPerformance
} from "../controllers/analyticsController.js"
import { isAuthenticated } from "../middlewares/session.js"
import { isSellerVerified } from "../middlewares/propertyAuth.js"

const router = Router()

// Both middlewares required:
// isAuthenticated → must be logged in
// isSellerVerified → must have role='seller'
router.get("/seller/analytics", isAuthenticated, isSellerVerified, getAnalytics)
router.get("/seller/analytics/properties", isAuthenticated, isSellerVerified, getPropertyAnalytics)
router.get("/analytics/market-trends", getMarketTrends)
router.get("/analytics/seller-performance", isAuthenticated, isSellerVerified, getSellerPerformance)

export default router
