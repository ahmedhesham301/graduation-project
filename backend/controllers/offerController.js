
import { 
    createOffer, 
    getBuyerOffers, 
    getSellerOffers, 
    updateOfferStatus,
    findActiveOfferByBuyerAndProperty,
    counterOfferPrice,
    finalizeOfferSale 
} from "../models/offerModel.js";
import { getPropertyById } from "../services/propertyServices.js";

export async function makeOffer(req, res) {
    try {
        const { propertyId } = req.params;
        const { offer_price } = req.body;
        const buyerId = req.session.userID;

        const property = await getPropertyById(propertyId);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        if (property.seller_id === buyerId) {
            return res.status(400).json({ error: "You cannot make an offer on your own property" });
        }

        if (!property.available) {
            return res.status(400).json({ error: "Property is no longer available" });
        }

        const existingOffer = await findActiveOfferByBuyerAndProperty(buyerId, propertyId);
        if (existingOffer) {
            return res.status(400).json({ error: "You already have a pending offer for this property" });
        }

        const offer = await createOffer(propertyId, buyerId, offer_price);
        res.status(201).json(offer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create offer" });
    }
}

export async function getMySentOffers(req, res) {
    try {
        const buyerId = req.session.userID;
        const offers = await getBuyerOffers(buyerId);
        res.status(200).json(offers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch offers" });
    }
}

export async function getReceivedOffers(req, res) {
    try {
        const sellerId = req.session.userID;
        const offers = await getSellerOffers(sellerId);
        res.status(200).json(offers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch offers" });
    }
}

export async function updateOffer(req, res) {
    try {
        const { offerId } = req.params;
        const { status } = req.body;
        const userId = req.session.userID;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updatedOffer = await updateOfferStatus(offerId, status, userId);
        if (!updatedOffer) {
            return res.status(404).json({ error: "Offer not found or unauthorized" });
        }

        res.status(200).json(updatedOffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update offer" });
    }
}

export async function counterOffer(req, res) {
    try {
        const { offerId } = req.params;
        const { counter_price } = req.body;
        const sellerId = req.session.userID;

        const updatedOffer = await counterOfferPrice(offerId, counter_price, sellerId);
        if (!updatedOffer) {
            return res.status(404).json({ error: "Offer not found or unauthorized" });
        }

        res.status(200).json(updatedOffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to counter offer" });
    }
}

export async function checkoutOffer(req, res) {
    try {
        const { offerId } = req.params;
        const { final_amount } = req.body;
        const buyerId = req.session.userID;

        const finalized = await finalizeOfferSale(offerId, buyerId, final_amount);
        if (!finalized) {
            return res.status(404).json({ error: "Offer not found or not in accepted state" });
        }

        res.status(200).json(finalized);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Checkout failed" });
    }
}
