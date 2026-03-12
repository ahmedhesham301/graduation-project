import { z } from "zod";

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
    try {
        await loginBodySchema.parseAsync(req.body)
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

function handleValidationError(error, res) {
    let validationErrors = {}
    let tree = z.treeifyError(error).properties
    for (const e in tree) {
        validationErrors[e] = tree[e].errors
    }
    res.status(400).json({ message: "Invalid input format", errors: validationErrors })
}