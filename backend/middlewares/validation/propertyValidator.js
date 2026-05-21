
import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js";

const idSchema = z.coerce.number().int().positive()
const fileExt = z.enum(["jpeg", "png", "webp", "jpg","zip"])
const mediaSchema = z.object({
    fileName: z.coerce.string().min(5).max(200).refine((fileName) => {
        const parts = fileName.split(".")
        if (parts.length !== 2) return false

        const result = fileExt.safeParse(parts[1])
        return result.success
    },
        {
            message: "unsupported file format"
        }
    ),
    size: z.coerce.number().int().positive().max(4000000000),
})

const propertySchema = z.object({
    type: z.string().min(1).max(100),
    condition: z.string().min(1).max(100),
    lon: z.coerce.number().min(25).max(36),
    lat: z.coerce.number().min(22).max(31.7),
    area: z.coerce.number().int().positive(),
    floors: z.coerce.number().int().positive(),
    rooms: z.coerce.number().int().positive(),
    bathrooms: z.coerce.number().int().positive(),
    city: z.string(),
    district: z.string(),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().int().positive(),
    media: mediaSchema.array().min(1).max(30)
})

const propertyPatchSchema = z.object({
    description: z.string().max(1000).nullable().optional(),
    condition: z.string().min(1).max(100).optional(),
    price: z.coerce.number().int().positive().optional(),
    sold_at: z.coerce.date().nullable().optional(),
    sold_price: z.coerce.number().int().positive().nullable().optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one property field is required" }
).refine(
    (data) => {
        if (data.sold_at && data.sold_price === undefined) return false;
        if (data.sold_price && data.sold_at === undefined) return false;
        return true;
    },
    { message: "sold_price and sold_at must be provided together" }
)

const propertyContactSchema = z.object({
    contact_method: z.enum(["phone", "email", "whatsapp"])
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

export async function validatePropertyPatchBody(req, res, next) {
    const result = await propertyPatchSchema.safeParseAsync(req.body)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.body = result.data
    next()
}

export async function validatePropertyContactBody(req, res, next) {
    const result = await propertyContactSchema.safeParseAsync(req.body ?? {})

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.body = result.data
    next()
}

export async function validatePropertyId(req, res, next) {
    const result = await idSchema.safeParseAsync(req.params.propertyId)
    if (!result.success) {
        return res.status(400).json({ error: "Invalid property ID" })
    }
    next()
}



const mediaIdSchema = z.object({
    propertyId: z.coerce.number().int().positive(),
    uuid: z.uuidv7(),
    ext: fileExt
})

export async function validateMediaId(req, res, next) {
    const parts = req.params.mediaId.split(".")
    if (parts.length !== 2) {
        res.status(404).send()
        return
    }

    const result = await mediaIdSchema.safeParseAsync({ uuid: parts[0], ext: parts[1], propertyId: req.params.propertyId })
    if (!result.success) {
        return res.status(404).send()
    }
    req.validated ??= {}
    req.validated.media = result.data
    next()
}
