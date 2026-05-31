
import { pool } from "../database/postgresql.js";

export async function createOffer(propertyId, buyerId, offerPrice) {
    const query = {
        text: `INSERT INTO purchase_offers (property_id, buyer_id, offer_price)
               VALUES ($1, $2, $3)
               RETURNING *`,
        values: [propertyId, buyerId, offerPrice]
    };
    const { rows } = await pool.query(query);
    return rows[0];
}

export async function getBuyerOffers(buyerId) {
    const query = {
        text: `SELECT po.*, p.price as listing_price, pt.name as type, c.name as city, d.name as district, p.seller_id
               FROM purchase_offers po
               JOIN properties p ON p.id = po.property_id
               JOIN property_types pt ON pt.id = p.type_id
               JOIN cities c ON c.id = p.city_id
               JOIN districts d ON d.id = p.district_id
               WHERE po.buyer_id = $1
               ORDER BY po.created_at DESC`,
        values: [buyerId]
    };
    const { rows } = await pool.query(query);
    return rows;
}

export async function getSellerOffers(sellerId) {
    const query = {
        text: `SELECT po.*, p.price as listing_price, pt.name as type, c.name as city, d.name as district, u.full_name as buyer_name, u.email as buyer_email, u.phone as buyer_phone
               FROM purchase_offers po
               JOIN properties p ON p.id = po.property_id
               JOIN property_types pt ON pt.id = p.type_id
               JOIN cities c ON c.id = p.city_id
               JOIN districts d ON d.id = p.district_id
               JOIN users u ON u.id = po.buyer_id
               WHERE p.seller_id = $1
               ORDER BY po.created_at DESC`,
        values: [sellerId]
    };
    const { rows } = await pool.query(query);
    return rows;
}

export async function findOfferById(offerId) {
    const query = {
        text: `SELECT po.*, p.seller_id 
               FROM purchase_offers po
               JOIN properties p ON p.id = po.property_id
               WHERE po.id = $1`,
        values: [offerId]
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}

export async function updateOfferStatus(offerId, status, userId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Verify offer exists
        const offerRes = await client.query({
            text: `SELECT po.*, p.seller_id 
                   FROM purchase_offers po
                   JOIN properties p ON p.id = po.property_id
                   WHERE po.id = $1 FOR UPDATE`,
            values: [offerId]
        });

        const offer = offerRes.rows[0];
        if (!offer) {
            await client.query("ROLLBACK");
            return null;
        }

        // Auth check: Sellers can accept/reject/counter. Buyers can accept/reject counter.
        const isSeller = offer.seller_id === userId;
        const isBuyer = offer.buyer_id === userId;

        if (!isSeller && !isBuyer) {
            await client.query("ROLLBACK");
            return null;
        }

        // Logic for accepting an offer (or a counter)
        if (status === 'accepted') {
            // Reject all other pending offers for this property
            await client.query({
                text: `UPDATE purchase_offers 
                       SET status = 'rejected', updated_at = now() 
                       WHERE property_id = $1 AND id != $2 AND status IN ('pending', 'countered')`,
                values: [offer.property_id, offerId]
            });
        }

        const updateRes = await client.query({
            text: `UPDATE purchase_offers 
                   SET status = $1, updated_at = now() 
                   WHERE id = $2 
                   RETURNING *`,
            values: [status, offerId]
        });

        await client.query("COMMIT");
        return updateRes.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function finalizeOfferSale(offerId, buyerId, finalAmount) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const offerRes = await client.query({
            text: `SELECT po.*, p.price as listing_price
                   FROM purchase_offers po
                   JOIN properties p ON p.id = po.property_id
                   WHERE po.id = $1 AND po.buyer_id = $2 AND po.status = 'accepted' FOR UPDATE`,
            values: [offerId, buyerId]
        });

        const offer = offerRes.rows[0];
        if (!offer) {
            await client.query("ROLLBACK");
            return null;
        }

        const soldPrice = finalAmount || (offer.counter_price || offer.offer_price);

        // Mark property as sold
        await client.query({
            text: `UPDATE properties 
                   SET sold_at = now(), sold_price = $1 
                   WHERE id = $2`,
                values: [soldPrice, offer.property_id]
        });

        // Mark offer as completed
        const updateRes = await client.query({
            text: `UPDATE purchase_offers 
                   SET status = 'completed', updated_at = now() 
                   WHERE id = $1 
                   RETURNING *`,
            values: [offerId]
        });

        await client.query("COMMIT");
        return updateRes.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function counterOfferPrice(offerId, counterPrice, sellerId) {
    const query = {
        text: `UPDATE purchase_offers po
               SET status = 'countered', counter_price = $1, updated_at = now()
               FROM properties p
               WHERE po.id = $2 AND p.id = po.property_id AND p.seller_id = $3
               RETURNING po.*`,
        values: [counterPrice, offerId, sellerId]
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}

export async function findActiveOfferByBuyerAndProperty(buyerId, propertyId) {
    const query = {
        text: `SELECT * FROM purchase_offers 
               WHERE buyer_id = $1 AND property_id = $2 AND status = 'pending'`,
        values: [buyerId, propertyId]
    };
    const { rows } = await pool.query(query);
    return rows[0] || null;
}
