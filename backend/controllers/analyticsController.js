/**
 * @file analyticsController.js
 * @layer Controller (HTTP Handler Layer)
 *
 * Intentionally thin — just calls the service and responds.
 * All business logic lives in the service and model.
 */

import {
    fetchSellerAnalytics,
    fetchSellerPropertyAnalytics,
    fetchMarketTrends,
    fetchSellerPerformance
} from "../services/analyticsServices.js"

/**
 * Handles GET /api/seller/analytics
 *
 * WHY isAuthenticated + isSellerVerified before this?
 * Analytics are private seller data. A buyer should never see
 * how many times other properties were saved. Role check is
 * enforced at the router level — controller stays clean.
 *
 * @route GET /api/seller/analytics
 * @access Protected — requires login + seller role
 */
export async function getAnalytics(req, res) {
    try {
        const analytics = await fetchSellerAnalytics(req.session.userID)
        res.status(200).json(analytics)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch analytics" })
    }
}

/**
 * Handles GET /api/analytics/seller/properties
 *
 * Returns per-listing analytics for the logged-in seller so the seller can
 * see which properties generate views, saves, and contact intent.
 *
 * Query params:
 *   - page: page number (default 1, min 1)
 *   - limit: items per page (default 20, max 100, min 1)
 *
 * Response includes data array with pagination metadata.
 */
export async function getSellerPropertyAnalytics(req, res) {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

        const result = await fetchSellerPropertyAnalytics(req.session.userID, page, limit)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch property analytics" })
    }
}

/**
 * Handles GET /api/analytics/market-trends
 *
 * This is public aggregate market data. It never returns buyer details,
 * seller details, or individual viewer identities.
 */
export async function getMarketTrends(req, res) {
    try {
        const trends = await fetchMarketTrends()
        res.status(200).json(trends)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch market trends" })
    }
}

/**
 * Handles GET /api/analytics/seller-performance
 *
 * This endpoint is focused on the currently logged-in seller.
 * It does not need a seller id in the URL because the session already
 * tells us which seller is asking for their own performance data.
 */
export async function getSellerPerformance(req, res) {
    try {
        const performance = await fetchSellerPerformance(req.session.userID)
        res.status(200).json(performance)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch seller performance" })
    }
}
