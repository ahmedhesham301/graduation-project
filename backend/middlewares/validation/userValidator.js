import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js"



// Sending fullName alone updates only the name, phone stays untouched.
// .refine() ensures they send at least one field instead of an empty body.
const updateUserSchema = z.object({
    fullName: z.string().min(1).max(100).optional(),
    phone:    z.e164().optional(),
    password: z.string().min(8).max(72)
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" })
        .optional(),
}).refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: "At least one field must be provided" }
)

export async function validateUpdateUser(req, res, next) {
    const result = await updateUserSchema.safeParseAsync(req.body)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.body = result.data
    next()
}