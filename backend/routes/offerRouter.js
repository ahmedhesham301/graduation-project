
import { Router } from "express";
import { 
    makeOffer, 
    getMySentOffers, 
    getReceivedOffers, 
    updateOffer,
    counterOffer,
    checkoutOffer 
} from "../controllers/offerController.js";
import { isAuthenticated } from "../middlewares/session.js";
import { isSellerVerified } from "../middlewares/propertyAuth.js";
import { validatePropertyId } from "../middlewares/validation/propertyValidator.js";
import { 
    validateOfferBody, 
    validateOfferUpdateBody, 
    validateOfferId,
    validateCounterOfferBody 
} from "../middlewares/validation/offerValidator.js";

const router = Router();

// Buyer routes
router.post("/properties/:propertyId/offers", isAuthenticated, validatePropertyId, validateOfferBody, makeOffer);
router.get("/user/offers", isAuthenticated, getMySentOffers);
router.patch("/user/offers/:offerId", isAuthenticated, validateOfferId, validateOfferUpdateBody, updateOffer);
router.post("/user/offers/:offerId/checkout", isAuthenticated, validateOfferId, checkoutOffer);

// Seller routes
router.get("/seller/offers", isAuthenticated, isSellerVerified, getReceivedOffers);
router.patch("/seller/offers/:offerId", isAuthenticated, isSellerVerified, validateOfferId, validateOfferUpdateBody, updateOffer);
router.post("/seller/offers/:offerId/counter", isAuthenticated, isSellerVerified, validateOfferId, validateCounterOfferBody, counterOffer);

export default router;
