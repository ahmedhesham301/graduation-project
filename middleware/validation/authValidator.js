import { z } from "zod";

const reqBodySchema = z.object({
    fullName: z.string(),
    email: z.email().max(254),
    password: z.string().min(8).max(72),
    phone: z.e164()
})

export async function validateBody(req, res, next) {
    try {
        await reqBodySchema.parseAsync(req.body)
        next()
    } catch (error) {
        if (error instanceof z.ZodError) {
            let validationErrors = {}
            let tree = z.treeifyError(error).properties
            for (const e in tree) {
                validationErrors[e] = tree[e].errors
            }
            res.status(400).json({ message: "Invalid input format", errors: validationErrors })
            return
        }
        res.status(500).json({ message: "internal server error" })
        logger.error("error validating auth request body.", {
            reason: error.message,
            stack: error.stack
        })
        return
    }
}