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
 * Returns performance-style analytics for the logged-in seller.
 *
 * Important limitation:
 * The current schema has properties and saved/favorites, but it does not
 * have orders, views, contacts, or sold dates. So this endpoint measures
 * performance using data we can trust today: listings, publish state,
 * listing age, and save/favorite engagement.
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
