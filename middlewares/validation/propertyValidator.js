
import { z } from "zod"


const propertySchema = z.object({
    type:        z.string().min(1).max(100),
    location:    z.string().min(1).max(255),
    area:        z.coerce.number().int().positive(),
    floors:      z.coerce.number().int().positive(),
    rooms:       z.coerce.number().int().positive(),
    bathrooms:   z.coerce.number().int().positive(),
    city:        z.string().min(1).max(100),
    district:    z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    price:       z.coerce.number().int().positive(),
})

export async function validatePropertyBody(req, res, next) {
    const result = propertySchema.safeParse(req.body)

    if (!result.success) {
       
        const validationErrors = {}
        const tree = z.treeifyError(result.error).properties
        for (const field in tree) {
            validationErrors[field] = tree[field].errors
        }
        return res.status(400).json({
            message: "Invalid input format",
            errors: validationErrors
        })
    }

    req.body = result.data
    next()
}