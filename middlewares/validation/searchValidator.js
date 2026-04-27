import { z } from "zod";
import { handleValidationError } from "./handleValidationError.js";
import qs from 'qs'

const parametersSchema = z.object({
    city: z.string().optional(),
    district: z.string().optional(),
    bathrooms: z.coerce.number().int().optional(),
    bedrooms: z.coerce.number().int().optional(),
    area: z.coerce.number().int().optional(),
    floors: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).max(999),
    orderBy: z.enum(["price", "bathrooms", "rooms", "area"]).optional(),
    orderDirection: z.enum(["asc", "desc"]).optional()
}).refine((data) =>
    Boolean(data.orderBy) === Boolean(data.orderDirection),
    {
        message: "orderDirection and orderBy must be used together"
    }
)

export async function validateSearchQuery(req, res, next) {
    let query = qs.parse(req.query)

    const result = await parametersSchema.safeParseAsync(query)
    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    if (Object.keys(result.data).length < 2 && result.data.page) {
        res.status(400).json({
            "message": "Invalid input format",
            "errors": {
                "page": [
                    "Please provide at least one additional search parameter besides page number."
                ]
            }
        })
        return
    } else if (result.data.orderBy && result.data.orderDirection && result.data.page && Object.keys(result.data).length < 4) {
        res.status(400).json({
            "message": "Invalid input format",
            "errors": {
                "page": [
                    "Please provide at least one additional search parameter besides page number, orderBy and orderDirection."
                ]
            }
        })
        return
    } else if (result.data.district && !result.data.city) {
        res.status(400).json({
            "message": "Invalid input format",
            "errors": {
                "city": [
                    "city has to exist when using distrct"
                ]
            }
        })
        return
    }


    req.updatedParameters = result.data
    next()
}
