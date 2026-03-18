import { z } from "zod";
import { handleValidationError } from "./handleValidationError.js";

const reqBodySchema = z.object({
    fullName: z.string(),
    email: z.email().max(254),
    password: z.string().min(8).max(72),
    phone: z.e164()
})

const loginBodySchema = z.object({
    email: z.email().max(254),
    password: z.string().min(8).max(72),
})

export async function validateRegisterBody(req, res, next) {
    try {
        await reqBodySchema.parseAsync(req.body)
        next()
    } catch (error) {
        if (error instanceof z.ZodError) {
            handleValidationError(error, res)
            return
        }
        res.status(500).json({ message: "internal server error" })
        console.error(error)
        return
    }
}

export async function validateLoginBody(req, res, next) {
    const result = await loginBodySchema.safeParseAsync(req.body)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }

    req.body = result.data
    next()
}

