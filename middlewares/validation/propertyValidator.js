
import { uuid, uuidv7, z } from "zod"
import { handleValidationError } from "./handleValidationError.js";

const idSchema = z.coerce.number().int().positive()
const mediaSchema = z.object({
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    size: z.coerce.number().int().positive().max(4000000000),
})


// const mediaIdSchema = z.string().refine((value) => {

//     const uuidResult = z.uuidv7().safeParse(parts[0])
//     if (!uuidResult) return false;
//     const extResult = allowedExts.safeParse(parts[1])
//     if (!extResult) return false;

// })
const propertySchema = z.object({
    type: z.string().min(1).max(100),
    lon: z.coerce.number().min(-180).max(180),
    lat: z.coerce.number().min(-90).max(90),
    area: z.coerce.number().int().positive(),
    floors: z.coerce.number().int().positive(),
    rooms: z.coerce.number().int().positive(),
    bathrooms: z.coerce.number().int().positive(),
    cityID: z.coerce.number().int().positive(),
    districtID: z.coerce.number().int().positive(),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().int().positive(),
    media: mediaSchema.array().min(1).max(30)
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
    const result = await idSchema.safeParseAsync(req.params.propertyId)
    if (!result.success) {
        return res.status(400).json({ error: "Invalid property ID" })
    }
    next()
}



const mediaIdSchema = z.object({
    propertyId: z.coerce.number().int().positive(),
    uuid: z.uuidv7(),
    ext: z.enum(["jpeg", "png", "webp"])
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