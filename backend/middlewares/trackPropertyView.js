import { recordPropertyView } from "../models/analyticsModel.js"

/**
 * Tracks successful property detail views without slowing down the response.
 *
 * The middleware waits until Express finishes sending the response. If the
 * property was found and returned with status 200, it writes one row into
 * property_views. If analytics fails, the user still gets the property data.
 */
export function trackPropertyView(req, res, next) {
    const propertyId = req.params.propertyId
    const userId = req.session.userID ?? null

    // For anonymous users, keep the session alive so repeat views from the
    // same browser can share one viewer_session_id.
    if (!userId) {
        req.session.analyticsViewer = true
    }

    const viewerSessionId = userId ? null : req.sessionID

    res.on("finish", () => {
        if (res.statusCode !== 200) return

        recordPropertyView(propertyId, userId, viewerSessionId).catch(error => {
            console.error("Failed to record property view", error)
        })
    })

    next()
}
