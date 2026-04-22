
import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js";

const idSchema = z.coerce.number().int().positive()
const mediaSchema = z.object({
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    size: z.coerce.number().int().positive().max(4000000000),
})
const propertySchema = z.object({
    type: z.string().min(1).max(100),
    lon:     z.coerce.number().min(-180).max(180),
    lat:     z.coerce.number().min(-90).max(90),
    area:        z.coerce.number().int().positive(),
    floors:      z.coerce.number().int().positive(),
    rooms:       z.coerce.number().int().positive(),
    bathrooms:   z.coerce.number().int().positive(),
    cityID:      z.coerce.number().int().positive(),
    districtID:  z.coerce.number().int().positive(),
    description: z.string().max(1000).optional(),
    price:       z.coerce.number().int().positive(),
    media: mediaSchema.array().min(2).max(30)
})

export async function validatePropertyBody(req, res, next) {
    const result = await propertySchema.safeParseAsync(req.body)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.body = result.data
    next()
}

export async function validatePropertyId(req, res, next) {
    const result = await idSchema.safeParseAsync(req.params.id)
    if (!result.success) {
        return res.status(400).json({ error: "Invalid property ID" })
    }
    next()
}
