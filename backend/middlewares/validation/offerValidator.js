
import { z } from "zod";
import { handleValidationError } from "./handleValidationError.js";

const idSchema = z.coerce.number().int().positive();

const offerSchema = z.object({
    offer_price: z.coerce.number().int().positive(),
});

const offerUpdateSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
});

const counterOfferSchema = z.object({
    counter_price: z.coerce.number().int().positive(),
});

export async function validateOfferBody(req, res, next) {
    const result = await offerSchema.safeParseAsync(req.body);
    if (!result.success) {
        handleValidationError(result.error, res);
        return;
    }
    req.body = result.data;
    next();
}

export async function validateOfferUpdateBody(req, res, next) {
    const result = await offerUpdateSchema.safeParseAsync(req.body);
    if (!result.success) {
        handleValidationError(result.error, res);
        return;
    }
    req.body = result.data;
    next();
}

export async function validateCounterOfferBody(req, res, next) {
    const result = await counterOfferSchema.safeParseAsync(req.body);
    if (!result.success) {
        handleValidationError(result.error, res);
        return;
    }
    req.body = result.data;
    next();
}

export async function validateOfferId(req, res, next) {
    const result = await idSchema.safeParseAsync(req.params.offerId);
    if (!result.success) {
        return res.status(400).json({ error: "Invalid offer ID" });
    }
    next();
}
