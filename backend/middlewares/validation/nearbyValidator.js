import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js"


const nearbySchema = z.object({
    lat:    z.coerce.number().min(-90).max(90),
    lon:    z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(0.1).max(100),  // in km
    page:   z.coerce.number().int().min(1).max(999).default(1)
})

export async function validateNearbyQuery(req, res, next) {
    const result = await nearbySchema.safeParseAsync(req.query)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.updatedParameters = result.data
    next()
}