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

export async function fetchSellerPerformance(sellerId) {
    const raw = await getSellerPerformanceStats(sellerId)

    const summary = raw.summary ? {
        total_listings: Number(raw.summary.total_listings),
        active_listings: Number(raw.summary.active_listings),
        draft_listings: Number(raw.summary.draft_listings),
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
