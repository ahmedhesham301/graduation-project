 /**
 * @file analyticsModel.js
 * @layer Model (Data Access Layer)
 *
 * DEFENSE PITCH:
 * "This model uses a single round-trip with multiple CTEs — Common Table
 * Expressions — to compute all metrics at once instead of making 4-5
 * separate queries. This demonstrates the difference between row-level
 * transactional queries and set-based analytical queries, which is the
 * core distinction between OLTP and OLAP query patterns."
 */

import { pool } from "../database/postgresql.js";

/**
 * Stores one property view event.
 *
 * userId is present for logged-in users. viewerSessionId is used for guests,
 * so market analytics can still count anonymous demand.
 */
export async function recordPropertyView(propertyId, userId, viewerSessionId) {
    const query = {
        name: 'record-property-view',
        text: `
            INSERT INTO property_views (property_id, user_id, viewer_session_id)
            VALUES ($1, $2, $3)
        `,
        values: [propertyId, userId ?? null, viewerSessionId ?? null]
    }

    await pool.query(query)
}

/**
 * Stores one contact-intent event for a property.
 *
 * This tracks the moment a visitor asks for seller contact details, which is
 * a stronger signal than a simple page view.
 */
export async function recordPropertyContact(propertyId, userId, contactSessionId, contactMethod) {
    const query = {
        name: 'record-property-contact',
        text: `
            INSERT INTO property_contacts (
                property_id,
                user_id,
                contact_session_id,
                contact_method
            )
            VALUES ($1, $2, $3, $4)
        `,
        values: [propertyId, userId ?? null, contactSessionId ?? null, contactMethod]
    }

    await pool.query(query)
}

/**
 * Returns aggregated seller statistics in one query using CTEs.
 *
 * WHY CTEs instead of separate queries?
 * Each separate query would be a round-trip to the DB — network latency
 * multiplied by the number of metrics. A single CTE-based query computes
 * everything in one execution plan, letting PostgreSQL optimize across
 * all sub-computations simultaneously.
 *
 * @param {number} sellerId - From req.session.userID
 * @returns {object} Analytics object with all seller metrics
 */
export async function getSellerAnalytics(sellerId) {
    const query = {
        text: `
            WITH

            -- CTE 1: All active properties for this seller
            seller_properties AS (
                SELECT
                    p.id,
                    p.price,
                    p.area,
                    pt.name AS type,
                    c.name AS city
                FROM properties p
                JOIN property_types pt ON pt.id = p.type_id
                JOIN cities c ON c.id = p.city_id
                WHERE p.seller_id = $1
                AND p.deleted_at IS NULL
            ),

            -- CTE 2: Save counts per property (how many buyers saved each)
            save_counts AS (
                SELECT
                    s.property_id,
                    COUNT(*) AS save_count
                FROM saved s
                WHERE s.property_id IN (SELECT id FROM seller_properties)
                GROUP BY s.property_id
            ),

            -- CTE 3: Overall summary metrics
            summary AS (
                SELECT
                    COUNT(sp.id)                        AS total_listings,
                    COALESCE(SUM(sc.save_count), 0)     AS total_saves,
                    COALESCE(MIN(sp.price), 0)          AS min_price,
                    COALESCE(MAX(sp.price), 0)          AS max_price,
                    COALESCE(ROUND(AVG(sp.price)), 0)   AS avg_price,
                    COALESCE(ROUND(AVG(sp.area)), 0)    AS avg_area
                FROM seller_properties sp
                LEFT JOIN save_counts sc ON sc.property_id = sp.id
            ),

            -- CTE 4: Most saved property
            most_saved AS (
                SELECT
                    sp.id,
                    sp.type,
                    sp.city,
                    sp.price,
                    COALESCE(sc.save_count, 0) AS saves
                FROM seller_properties sp
                LEFT JOIN save_counts sc ON sc.property_id = sp.id
                ORDER BY saves DESC
                LIMIT 1
            ),

            -- CTE 5: Listings grouped by city
            by_city AS (
                SELECT
                    city,
                    COUNT(*) AS count
                FROM seller_properties
                GROUP BY city
                ORDER BY count DESC
            ),

            -- CTE 6: Listings grouped by type
            by_type AS (
                SELECT
                    type,
                    COUNT(*) AS count
                FROM seller_properties
                GROUP BY type
                ORDER BY count DESC
            )

            -- Final SELECT: assemble everything into one JSON response
            SELECT
                (SELECT row_to_json(summary) FROM summary)          AS summary,
                (SELECT row_to_json(most_saved) FROM most_saved)    AS most_saved,
                (SELECT json_agg(by_city) FROM by_city)             AS by_city,
                (SELECT json_agg(by_type) FROM by_type)             AS by_type
        `,
        values: [sellerId]
    }

    const { rows } = await pool.query(query)
    return rows[0]
}

/**
 * Returns one analytics row per property owned by the seller.
 *
 * Views, saves, and contacts are aggregated in separate CTEs first. That
 * prevents inflated counts from joining multiple event tables directly.
 */
export async function getSellerPropertyAnalyticsStats(sellerId) {
    const query = {
        text: `
            WITH

            seller_properties AS (
                SELECT
                    p.id,
                    p.price,
                    p.status,
                    p.pending_media,
                    p.created_at,
                    pt.name AS type,
                    c.name AS city,
                    d.name AS district
                FROM properties p
                JOIN property_types pt ON pt.id = p.type_id
                JOIN cities c ON c.id = p.city_id
                JOIN districts d ON d.id = p.district_id
                WHERE p.seller_id = $1
                AND p.deleted_at IS NULL
            ),

            view_counts AS (
                SELECT
                    property_id,
                    COUNT(*) AS views
                FROM property_views
                WHERE property_id IN (SELECT id FROM seller_properties)
                GROUP BY property_id
            ),

            save_counts AS (
                SELECT
                    property_id,
                    COUNT(*) AS saves
                FROM saved
                WHERE property_id IN (SELECT id FROM seller_properties)
                GROUP BY property_id
            ),

            contact_counts AS (
                SELECT
                    property_id,
                    COUNT(*) AS contacts
                FROM property_contacts
                WHERE property_id IN (SELECT id FROM seller_properties)
                GROUP BY property_id
            )

            SELECT
                sp.id AS property_id,
                sp.type,
                sp.city,
                sp.district,
                sp.price,
                sp.status,
                sp.pending_media,
                sp.created_at,
                COALESCE(vc.views, 0) AS views,
                COALESCE(sc.saves, 0) AS saves,
                COALESCE(cc.contacts, 0) AS contacts,
                CASE
                    WHEN COALESCE(vc.views, 0) = 0 THEN 0
                    ELSE ROUND((COALESCE(sc.saves, 0)::numeric / vc.views) * 100, 2)
                END AS view_to_save_rate,
                CASE
                    WHEN COALESCE(vc.views, 0) = 0 THEN 0
                    ELSE ROUND((COALESCE(cc.contacts, 0)::numeric / vc.views) * 100, 2)
                END AS view_to_contact_rate
            FROM seller_properties sp
            LEFT JOIN view_counts vc ON vc.property_id = sp.id
            LEFT JOIN save_counts sc ON sc.property_id = sp.id
            LEFT JOIN contact_counts cc ON cc.property_id = sp.id
            ORDER BY contacts DESC, saves DESC, views DESC, sp.created_at DESC
        `,
        values: [sellerId]
    }

    const { rows } = await pool.query(query)
    return rows
}

/**
 * Returns global market trend data.
 *
 * This endpoint needs three kinds of historical facts:
 * - properties.created_at: when a listing entered the market
 * - properties.sold_at/status: when a listing left the market as sold
 * - property_price_history/property_views: price movement and demand
 */
export async function getMarketTrendStats() {
    const query = {
        text: `
            WITH

            market_properties AS (
                SELECT
                    p.id,
                    p.price,
                    p.sold_price,
                    p.status,
                    p.created_at,
                    p.sold_at,
                    c.name AS city
                FROM properties p
                JOIN cities c ON c.id = p.city_id
                WHERE p.deleted_at IS NULL
            ),

            view_counts AS (
                SELECT
                    pv.property_id,
                    COUNT(*) AS views
                FROM property_views pv
                GROUP BY pv.property_id
            ),

            save_counts AS (
                SELECT
                    s.property_id,
                    COUNT(*) AS saves
                FROM saved s
                GROUP BY s.property_id
            ),

            summary AS (
                SELECT
                    COUNT(*) AS total_listings,
                    COUNT(*) FILTER (WHERE status = 'listed') AS active_listings,
                    COUNT(*) FILTER (WHERE status = 'sold') AS sold_listings,
                    COALESCE((SELECT COUNT(*) FROM property_views), 0) AS total_views,
                    COALESCE((SELECT COUNT(*) FROM saved), 0) AS total_saves,
                    COALESCE(ROUND(AVG(price)), 0) AS average_listing_price
                FROM market_properties
            ),

            -- New listings by month. This works with your original schema.
            listing_trends AS (
                SELECT
                    to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                    COUNT(*) AS new_listings
                FROM market_properties
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at)
            ),

            -- Sold listings by month. Requires status='sold' and sold_at.
            sales_trends AS (
                SELECT
                    to_char(date_trunc('month', sold_at), 'YYYY-MM') AS month,
                    COUNT(*) AS sold_listings,
                    COALESCE(ROUND(AVG(COALESCE(sold_price, price))), 0) AS average_sold_price
                FROM market_properties
                WHERE status = 'sold'
                AND sold_at IS NOT NULL
                GROUP BY date_trunc('month', sold_at)
                ORDER BY date_trunc('month', sold_at)
            ),

            -- Price movement by month. Requires inserting a row whenever
            -- a property's price changes.
            price_trends AS (
                SELECT
                    to_char(date_trunc('month', changed_at), 'YYYY-MM') AS month,
                    COUNT(*) AS price_changes,
                    COALESCE(ROUND(AVG(new_price)), 0) AS average_new_price
                FROM property_price_history
                GROUP BY date_trunc('month', changed_at)
                ORDER BY date_trunc('month', changed_at)
            ),

            -- Demand trend by month. anonymous viewers use viewer_session_id;
            -- logged-in viewers use user_id.
            view_trends AS (
                SELECT
                    to_char(date_trunc('month', viewed_at), 'YYYY-MM') AS month,
                    COUNT(*) AS views,
                    COUNT(DISTINCT COALESCE(user_id::text, viewer_session_id)) AS unique_viewers
                FROM property_views
                GROUP BY date_trunc('month', viewed_at)
                ORDER BY date_trunc('month', viewed_at)
            ),

            hotspots AS (
                SELECT
                    mp.city,
                    COUNT(*) FILTER (WHERE mp.status = 'listed') AS active_listings,
                    COALESCE(SUM(vc.views), 0) AS views,
                    COALESCE(SUM(sc.saves), 0) AS saves,
                    COALESCE(ROUND(AVG(mp.price)), 0) AS average_price
                FROM market_properties mp
                LEFT JOIN view_counts vc ON vc.property_id = mp.id
                LEFT JOIN save_counts sc ON sc.property_id = mp.id
                GROUP BY mp.city
                ORDER BY views DESC, saves DESC, active_listings DESC
                LIMIT 10
            )

            SELECT
                (SELECT row_to_json(summary) FROM summary) AS summary,
                COALESCE((SELECT json_agg(listing_trends) FROM listing_trends), '[]'::json) AS listing_trends,
                COALESCE((SELECT json_agg(sales_trends) FROM sales_trends), '[]'::json) AS sales_trends,
                COALESCE((SELECT json_agg(price_trends) FROM price_trends), '[]'::json) AS price_trends,
                COALESCE((SELECT json_agg(view_trends) FROM view_trends), '[]'::json) AS view_trends,
                COALESCE((SELECT json_agg(hotspots) FROM hotspots), '[]'::json) AS hotspots
        `
    }

    const { rows } = await pool.query(query)
    return rows[0]
}

/**
 * Returns performance-style analytics for the logged-in seller.
 *
 * This endpoint stays seller-level. Property-level views, saves, and
 * contacts are returned by getSellerPropertyAnalyticsStats.
 */
export async function getSellerPerformanceStats(sellerId) {
    const query = {
        text: `
            WITH

            -- All non-deleted properties owned by this seller.
            seller_properties AS (
                SELECT
                    p.id,
                    p.price,
                    p.pending_media,
                    p.created_at,
                    pt.name AS type,
                    c.name AS city,
                    d.name AS district
                FROM properties p
                JOIN property_types pt ON pt.id = p.type_id
                JOIN cities c ON c.id = p.city_id
                JOIN districts d ON d.id = p.district_id
                WHERE p.seller_id = $1
                AND p.deleted_at IS NULL
            ),

            -- Favorites/saves are the engagement signal available in this schema.
            save_counts AS (
                SELECT 
                    s.property_id,
                    COUNT(*) AS saves
                FROM saved s
                WHERE s.property_id IN (SELECT id FROM seller_properties)
                GROUP BY s.property_id
            ),

            -- One row per property with its computed save count and age.
            property_performance AS (
                SELECT
                    sp.id,
                    sp.type,
                    sp.city,
                    sp.district,
                    sp.price,
                    sp.pending_media,
                    sp.created_at,
                    ROUND((EXTRACT(EPOCH FROM (now() - sp.created_at)) / 86400)::numeric, 1) AS listing_age_days,
                    COALESCE(sc.saves, 0) AS saves
                FROM seller_properties sp
                LEFT JOIN save_counts sc ON sc.property_id = sp.id
            ),

            -- Overall seller-level KPIs.
            summary AS (
                SELECT
                    COUNT(*) AS total_listings,
                    COUNT(*) FILTER (WHERE pending_media = false) AS active_listings,
                    COUNT(*) FILTER (WHERE pending_media = true) AS draft_listings,
                    COALESCE(SUM(saves), 0) AS total_saves,
                    COALESCE(ROUND(AVG(saves)::numeric, 2), 0) AS average_saves_per_listing,
                    COALESCE(
                        ROUND(AVG(listing_age_days) FILTER (WHERE pending_media = false), 1),
                        0
                    ) AS average_active_listing_age_days,
                    MAX(created_at) AS newest_listing_at,
                    MIN(created_at) AS oldest_listing_at
                FROM property_performance
            ),

            -- Highest-engagement properties first. This helps a seller see
            -- what is working without opening every listing one by one.
            top_properties AS (
                SELECT
                    id,
                    type,
                    city,
                    district,
                    price,
                    pending_media,
                    listing_age_days,
                    saves
                FROM property_performance
                ORDER BY saves DESC, pending_media ASC, created_at DESC
                LIMIT 5
            ),

            by_city AS (
                SELECT
                    city,
                    COUNT(*) AS listings,
                    COALESCE(SUM(saves), 0) AS saves,
                    COALESCE(ROUND(AVG(saves)::numeric, 2), 0) AS average_saves_per_listing
                FROM property_performance
                GROUP BY city
                ORDER BY saves DESC, listings DESC
            ),

            by_type AS (
                SELECT
                    type,
                    COUNT(*) AS listings,
                    COALESCE(SUM(saves), 0) AS saves,
                    COALESCE(ROUND(AVG(saves)::numeric, 2), 0) AS average_saves_per_listing
                FROM property_performance
                GROUP BY type
                ORDER BY saves DESC, listings DESC
            )

            SELECT
                (SELECT row_to_json(summary) FROM summary) AS summary,
                COALESCE((SELECT json_agg(top_properties) FROM top_properties), '[]'::json) AS top_properties,
                COALESCE((SELECT json_agg(by_city) FROM by_city), '[]'::json) AS by_city,
                COALESCE((SELECT json_agg(by_type) FROM by_type), '[]'::json) AS by_type
        `,
        values: [sellerId]
    }

    const { rows } = await pool.query(query)
    return rows[0]
}
