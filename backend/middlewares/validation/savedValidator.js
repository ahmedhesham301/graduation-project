
import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js"


const propertyIdSchema = z.object({
    propertyId: z.coerce.number().int().positive()
})

export async function validatePropertyId(req, res, next) {
    const result = await propertyIdSchema.safeParseAsync(req.params)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    // Replace req.params.propertyId with coerced number
    req.params.propertyId = result.data.propertyId
    next()
}