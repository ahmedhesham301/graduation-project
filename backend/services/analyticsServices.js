/**
 * @file analyticsServices.js
 * @layer Service (Business Logic Layer)
 *
 * WHY a service layer for analytics?
 * The model returns raw DB types — numbers come back as strings from
 * PostgreSQL (NUMERIC/BIGINT). The service normalizes them to proper
 * JS types so the controller and frontend receive clean data.
 */

import {
    getSellerAnalytics,
    getMarketTrendStats,
    getSellerPropertyAnalyticsStats,
    getSellerPerformanceStats
} from "../models/analyticsModel.js"

export async function fetchSellerAnalytics(sellerId) {
    const raw = await getSellerAnalytics(sellerId)

    // PostgreSQL returns NUMERIC values as strings — coerce them
    const summary = raw.summary ? {
        total_listings: Number(raw.summary.total_listings),
        total_saves:    Number(raw.summary.total_saves),
        min_price:      Number(raw.summary.min_price),
        max_price:      Number(raw.summary.max_price),
        avg_price:      Number(raw.summary.avg_price),
        avg_area:       Number(raw.summary.avg_area),
    } : null

    const most_saved = raw.most_saved ? {
        id:    raw.most_saved.id,
        type:  raw.most_saved.type,
        city:  raw.most_saved.city,
        price: Number(raw.most_saved.price),
        saves: Number(raw.most_saved.saves),
    } : null

    const by_city = (raw.by_city || []).map(row => ({
        city:  row.city,
        count: Number(row.count)
    }))

    const by_type = (raw.by_type || []).map(row => ({
        type:  row.type,
        count: Number(row.count)
    }))

    return { summary, most_saved, by_city, by_type }
}

export async function fetchSellerPropertyAnalytics(sellerId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const rows = await getSellerPropertyAnalyticsStats(sellerId, limit, offset)

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0

    const data = rows.map(row => ({
        property_id: row.property_id,
        type: row.type,
        city: row.city,
        district: row.district,
        price: Number(row.price),
        listing_status: row.listing_status,
        pending_media: row.pending_media,
        created_at: row.created_at,
        views: Number(row.views),
        saves: Number(row.saves),
        contacts: Number(row.contacts),
        price_changes: Number(row.price_changes),
        view_to_save_rate: Number(row.view_to_save_rate),
        view_to_contact_rate: Number(row.view_to_contact_rate)
    }))

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    }
}

export async function fetchMarketTrends() {
    const raw = await getMarketTrendStats()

    const summary = raw.summary ? {
        total_listings: Number(raw.summary.total_listings),
        active_listings: Number(raw.summary.active_listings),
        sold_listings: Number(raw.summary.sold_listings),
        total_views: Number(raw.summary.total_views),
        total_saves: Number(raw.summary.total_saves),
        average_listing_price: Number(raw.summary.average_listing_price)
    } : null

    const listing_trends = (raw.listing_trends || []).map(row => ({
        month: row.month,
        new_listings: Number(row.new_listings)
    }))

    const sales_trends = (raw.sales_trends || []).map(row => ({
        month: row.month,
        sold_listings: Number(row.sold_listings),
        average_sold_price: Number(row.average_sold_price)
    }))

    const price_trends = (raw.price_trends || []).map(row => ({
        month: row.month,
        price_changes: Number(row.price_changes),
        average_new_price: Number(row.average_new_price)
    }))

    const view_trends = (raw.view_trends || []).map(row => ({
        month: row.month,
        views: Number(row.views),
        unique_viewers: Number(row.unique_viewers)
    }))

    const hotspots = (raw.hotspots || []).map(row => ({
        city: row.city,
        active_listings: Number(row.active_listings),
        views: Number(row.views),
        saves: Number(row.saves),
        average_price: Number(row.average_price)
    }))

    return { summary, listing_trends, sales_trends, price_trends, view_trends, hotspots }
}

export async function fetchSellerPerformance(sellerId) {
    const raw = await getSellerPerformanceStats(sellerId)

    const summary = raw.summary ? {
        total_listings: Number(raw.summary.total_listings),
        active_listings: Number(raw.summary.active_listings),
        draft_listings: Number(raw.summary.draft_listings),
        sold_listings: Number(raw.summary.sold_listings),
        total_saves: Number(raw.summary.total_saves),
        average_saves_per_listing: Number(raw.summary.average_saves_per_listing),
        average_active_listing_age_days: Number(raw.summary.average_active_listing_age_days),
        newest_listing_at: raw.summary.newest_listing_at,
        oldest_listing_at: raw.summary.oldest_listing_at
    } : null

    const top_properties = (raw.top_properties || []).map(property => ({
        id: property.id,
        type: property.type,
        city: property.city,
        district: property.district,
        price: Number(property.price),
        listing_status: property.listing_status,
        pending_media: property.pending_media,
        listing_age_days: Number(property.listing_age_days),
        saves: Number(property.saves)
    }))

    const by_city = (raw.by_city || []).map(row => ({
        city: row.city,
        listings: Number(row.listings),
        saves: Number(row.saves),
        average_saves_per_listing: Number(row.average_saves_per_listing)
    }))

    const by_type = (raw.by_type || []).map(row => ({
        type: row.type,
        listings: Number(row.listings),
        saves: Number(row.saves),
        average_saves_per_listing: Number(row.average_saves_per_listing)
    }))

    return { summary, top_properties, by_city, by_type }
}
