
import { z } from "zod"
import { handleValidationError } from "./handleValidationError.js"


const message = z.object({
    message: z.string().trim().min(1)
})

export async function validateMessage(req, res, next) {
    const result = await message.safeParseAsync(req.body)

    if (!result.success) {
        handleValidationError(result.error, res)
        return
    }
    req.body = result.data
    next()
}