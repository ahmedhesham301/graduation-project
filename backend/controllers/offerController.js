
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
import { createNotification } from "../models/notificationModel.js";
import { pool } from "../database/postgresql.js";

async function getUserName(userId) {
    const { rows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    return rows[0]?.full_name || 'Someone';
}

async function getPropertyTitle(propertyId) {
    const { rows } = await pool.query('SELECT description FROM properties WHERE id = $1', [propertyId]);
    return rows[0]?.description || 'a property';
}

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

        // Notify seller
        try {
            const buyerName = await getUserName(buyerId);
            const propTitle = await getPropertyTitle(propertyId);
            await createNotification(
                property.seller_id,
                'new_offer',
                `${buyerName} made an offer on "${propTitle}"`,
                `Offer: EGP ${Number(offer_price).toLocaleString()}`,
                Number(propertyId),
                buyerId
            );
        } catch (_) {}

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

        // Notify the other party
        try {
            const propTitle = await getPropertyTitle(updatedOffer.property_id);
            if (status === 'accepted') {
                // Seller accepted -> notify buyer
                const sellerName = await getUserName(userId);
                await createNotification(
                    updatedOffer.buyer_id,
                    'offer_accepted',
                    `Your offer was accepted by ${sellerName} on "${propTitle}"`,
                    `You can now proceed to checkout.`,
                    Number(updatedOffer.property_id),
                    userId
                );
            } else if (status === 'rejected') {
                // Could be seller rejecting or buyer rejecting counter
                const offerData = await pool.query(
                    'SELECT po.buyer_id, po.property_id, p.seller_id FROM purchase_offers po JOIN properties p ON p.id = po.property_id WHERE po.id = $1',
                    [offerId]
                );
                const { buyer_id, seller_id } = offerData.rows[0] || {};
                if (userId === seller_id && buyer_id) {
                    // Seller rejected -> notify buyer
                    const sellerName = await getUserName(userId);
                    await createNotification(
                        buyer_id,
                        'offer_rejected',
                        `Your offer was rejected by ${sellerName} on "${propTitle}"`,
                        `Your offer has been declined.`,
                        Number(updatedOffer.property_id),
                        userId
                    );
                } else if (userId === buyer_id && seller_id) {
                    // Buyer rejected counter -> notify seller
                    const buyerName = await getUserName(userId);
                    await createNotification(
                        seller_id,
                        'offer_rejected',
                        `${buyerName} rejected your counter-offer on "${propTitle}"`,
                        `The buyer declined the counter-offer.`,
                        Number(updatedOffer.property_id),
                        userId
                    );
                }
            }
        } catch (_) {}

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

        // Notify buyer
        try {
            const sellerName = await getUserName(sellerId);
            const propTitle = await getPropertyTitle(updatedOffer.property_id);
            await createNotification(
                updatedOffer.buyer_id,
                'offer_countered',
                `${sellerName} sent a counter-offer on "${propTitle}"`,
                `Counter price: EGP ${Number(counter_price).toLocaleString()}`,
                Number(updatedOffer.property_id),
                sellerId
            );
        } catch (_) {}

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
