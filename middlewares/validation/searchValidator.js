import { z } from "zod";
import { handleValidationError } from "./handleValidationError.js";
import qs from 'qs'

const parametersSchema = z.object({
    city: z.coerce.string().optional(),
    district: z.coerce.string().optional(),
    bathrooms: z.coerce.number().int().optional(),
    rooms: z.coerce.number().int().optional(),
    area: z.coerce.number().int().optional(),
    floors: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).max(999)
})

export async function validateSearchQuery(req, res, next) {
    let query = qs.parse(req.query)

    const result = await parametersSchema.safeParseAsync(query)
    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }
    
    if (Object.keys(result.data).length < 2) {
        res.status(400).json({ "error": "Please provide at least one additional search parameter besides the page number." })
        return
    }
    req.updatedParameters = result.data
    next()
}
