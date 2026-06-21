import { pool } from "../database/postgresql.js";

export async function getDashboardStats() {
    const result = await pool.query(`
        SELECT
            (SELECT COUNT(*)::INT FROM users) AS total_users,
            (SELECT COUNT(*)::INT FROM users WHERE role = 'buyer') AS total_buyers,
            (SELECT COUNT(*)::INT FROM users WHERE role = 'seller') AS total_sellers,
            (SELECT COUNT(*)::INT FROM properties) AS total_properties,
            (SELECT COUNT(*)::INT FROM properties WHERE sold_at IS NOT NULL) AS sold_properties,
            (SELECT COUNT(*)::INT FROM properties WHERE created_at > NOW() - INTERVAL '30 days') AS new_properties_30d,
            (SELECT COUNT(*)::INT FROM users WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_30d,
            (SELECT COUNT(*)::INT FROM property_contact_events) AS total_contacts
    `)
    return result.rows[0]
}

export async function getRecentUsers(limit = 10) {
    const result = await pool.query(
        `SELECT id, full_name, email, phone, role, created_at
         FROM users ORDER BY created_at DESC LIMIT $1`,
        [limit]
    )
    return result.rows
}

export async function getRecentProperties(limit = 10) {
    const result = await pool.query(
        `SELECT p.id, p.description, p.price, c.name AS city, d.name AS district, p.created_at, p.sold_at,
                u.full_name AS seller_name, p.moderation_status
         FROM properties p
         JOIN users u ON p.seller_id = u.id
         JOIN cities c ON p.city_id = c.id
         JOIN districts d ON p.district_id = d.id
         ORDER BY p.created_at DESC LIMIT $1`,
        [limit]
    )
    return result.rows
}

export async function getAllUsers(page = 1, search = '', role = '', sortBy = 'created_at', sortOrder = 'DESC') {
    const limit = 20
    const offset = (page - 1) * limit
    let query = `SELECT id, full_name, email, phone, role, created_at FROM users WHERE 1=1`
    const params = []

    if (search) {
        params.push(`%${search}%`)
        query += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`
    }
    if (role) {
        params.push(role)
        query += ` AND role = $${params.length}`
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM')

    const allowedSortFields = ['created_at', 'full_name', 'email', 'role']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    params.push(limit)
    query += ` ORDER BY ${sortField} ${direction} LIMIT $${params.length}`
    params.push(offset)
    query += ` OFFSET $${params.length}`

    const [usersResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, params.length - 2))
    ])

    return {
        users: usersResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
}

export async function getUserById(id) {
    const result = await pool.query(
        `SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1`,
        [id]
    )
    return result.rows[0] || null
}

export async function updateUserRole(id, role) {
    const result = await pool.query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role`,
        [role, id]
    )
    return result.rows[0] || null
}

export async function deleteUser(id) {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id])
    return result.rowCount > 0
}

export async function getAllProperties(page = 1, search = '', city = '', typeId = null, sortBy = 'created_at', sortOrder = 'DESC', status = '') {
    const limit = 20
    const offset = (page - 1) * limit
    let where = `WHERE 1=1 AND p.deleted_at IS NULL`
    const params = []

    if (search) {
        params.push(`%${search}%`)
        where += ` AND (c.name ILIKE $${params.length} OR d.name ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`
    }
    if (city) {
        params.push(`%${city}%`)
        where += ` AND c.name ILIKE $${params.length}`
    }
    if (typeId) {
        params.push(typeId)
        where += ` AND p.type_id = $${params.length}`
    }
    if (status) {
        params.push(status)
        where += ` AND p.moderation_status = $${params.length}`
    }

    const joins = `FROM properties p
                 JOIN users u ON p.seller_id = u.id
                 JOIN cities c ON p.city_id = c.id
                 JOIN districts d ON p.district_id = d.id
                 JOIN property_types pt ON p.type_id = pt.id`

    const allowedSortFields = ['created_at', 'price', 'area', 'rooms']
    const sortField = allowedSortFields.includes(sortBy) ? `p.${sortBy}` : 'p.created_at'
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    const countParams = [...params]
    params.push(limit)
    params.push(offset)

    const query = `SELECT p.id, pt.name AS type, p.price, c.name AS city, d.name AS district, p.area, p.condition,
                        p.created_at, p.sold_at, u.full_name AS seller_name, u.id AS seller_id, p.moderation_status
                 ${joins} ${where}
                 ORDER BY ${sortField} ${direction} LIMIT $${params.length - 1} OFFSET $${params.length}`

    const countQuery = `SELECT COUNT(*) ${joins} ${where}`

    const [propsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, countParams)
    ])

    return {
        properties: propsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
}

export async function updatePropertyAdmin(id, data) {
    const { area, floors, rooms, bathrooms, description, price, condition, moderation_status, rejection_reason } = data;
    const result = await pool.query(
        `UPDATE properties
         SET area = COALESCE($1, area), 
             floors = COALESCE($2, floors), 
             rooms = COALESCE($3, rooms), 
             bathrooms = COALESCE($4, bathrooms), 
             description = COALESCE($5, description), 
             price = COALESCE($6, price), 
             condition = COALESCE($7, condition),
             moderation_status = COALESCE($8, moderation_status),
             rejection_reason = COALESCE($9, rejection_reason)
         WHERE id = $10 RETURNING id`,
        [area, floors, rooms, bathrooms, description, price, condition, moderation_status, rejection_reason, id]
    )
    return result.rows[0] || null
}

export async function approvePropertyListing(id) {
    await pool.query(
        `UPDATE properties SET moderation_status = 'approved', rejection_reason = NULL WHERE id = $1`,
        [id]
    )
}

export async function approveAllPropertyListings() {
    await pool.query(
        `UPDATE properties SET moderation_status = 'approved', rejection_reason = NULL WHERE moderation_status = 'pending'`
    )
}

export async function rejectPropertyListing(id, reason) {
    await pool.query(
        `UPDATE properties SET moderation_status = 'rejected', rejection_reason = $1 WHERE id = $2`,
        [reason, id]
    )
}

export async function getSiteSettings() {
    const result = await pool.query(`SELECT key, value FROM site_settings`)
    const settings = {}
    result.rows.forEach(row => {
        settings[row.key] = row.value
    })
    return settings
}

export async function updateSiteSetting(key, value) {
    await pool.query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
    )
}

export async function deletePropertyAdmin(id) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM property_media WHERE property_id = $1`, [id]);
        await client.query(`DELETE FROM saved WHERE property_id = $1`, [id]);
        await client.query(`DELETE FROM property_features WHERE property_id = $1`, [id]);
        await client.query(`DELETE FROM property_price_history WHERE property_id = $1`, [id]);
        await client.query(`DELETE FROM property_views WHERE property_id = $1`, [id]);
        await client.query(`DELETE FROM property_contact_events WHERE property_id = $1`, [id]);
        const result = await client.query(`DELETE FROM properties WHERE id = $1`, [id]);
        await client.query('COMMIT');
        return result.rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getUserRegistrationsByMonth() {
    const result = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::INT AS count
        FROM users
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
    `)
    return result.rows
}

export async function getPropertyListingsByMonth() {
    const result = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::INT AS count
        FROM properties
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
    `)
    return result.rows
}

export async function getTopCities() {
    const result = await pool.query(`
        SELECT c.name AS city, COUNT(*)::INT AS count
        FROM properties p
        JOIN cities c ON p.city_id = c.id
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 10
    `)
    return result.rows
}

export async function getPropertyDistribution() {
    const result = await pool.query(`
        SELECT pt.name as label, COUNT(*)::INT as count
        FROM properties p
        JOIN property_types pt ON p.type_id = pt.id
        GROUP BY pt.name
    `)
    return result.rows
}

export async function getUserDistribution() {
    const result = await pool.query(`
        SELECT role as label, COUNT(*)::INT as count
        FROM users
        GROUP BY role
    `)
    return result.rows
}

export async function getContactsByMonth() {
    const result = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', contacted_at), 'YYYY-MM') AS month,
            COUNT(*)::INT AS count
        FROM property_contact_events
        WHERE contacted_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', contacted_at)
        ORDER BY DATE_TRUNC('month', contacted_at)
    `)
    return result.rows
}

export async function getPendingSellerRequests() {
    const result = await pool.query(`
        SELECT sp.id, sp.user_id, sp.status, sp.business_name, sp.business_type,
               sp.national_id, sp.submitted_at, sp.reviewed_at, sp.rejection_reason,
               u.full_name, u.email, u.phone
        FROM seller_profile sp
        JOIN users u ON sp.user_id = u.id
        ORDER BY CASE sp.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END, sp.submitted_at DESC
    `)
    return result.rows
}

export async function approveSellerRequest(userId) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query(
            `UPDATE seller_profile SET status = 'verified', reviewed_at = NOW(), rejection_reason = NULL WHERE user_id = $1`,
            [userId]
        )
        await client.query(
            `UPDATE users SET role = 'seller' WHERE id = $1`,
            [userId]
        )
        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function rejectSellerRequest(userId, reason) {
    await pool.query(
        `UPDATE seller_profile SET status = 'rejected', reviewed_at = NOW(), rejection_reason = $1 WHERE user_id = $2`,
        [reason, userId]
    )
}

export async function getPropertyDetails(id) {
    const result = await pool.query(`
        SELECT p.*, pt.name AS type, c.name AS city, d.name AS district,
               u.full_name AS seller_name, u.email AS seller_email, u.phone AS seller_phone
        FROM properties p
        JOIN users u ON p.seller_id = u.id
        JOIN cities c ON p.city_id = c.id
        JOIN districts d ON p.district_id = d.id
        JOIN property_types pt ON p.type_id = pt.id
        WHERE p.id = $1
    `, [id])
    return result.rows[0] || null
}

export async function getPropertyMedia(propertyId) {
    const result = await pool.query(
        `SELECT id, s3_key, extension, created_at, uploaded_at FROM property_media WHERE property_id = $1`,
        [propertyId]
    )
    return result.rows
}

export async function getContactEvents(page = 1, from = null, to = null) {
    const limit = 20
    const offset = (page - 1) * limit
    let where = 'WHERE 1=1'
    const params = []

    if (from) {
        params.push(from)
        where += ` AND pce.contacted_at >= $${params.length}`
    }
    if (to) {
        params.push(to)
        where += ` AND pce.contacted_at <= $${params.length}`
    }

    const joins = `FROM property_contact_events pce
        JOIN properties p ON pce.property_id = p.id
        JOIN cities c ON p.city_id = c.id
        JOIN users seller ON p.seller_id = seller.id
        LEFT JOIN users buyer ON pce.user_id = buyer.id`

    const countParams = [...params]
    params.push(limit)
    params.push(offset)

    const query = `SELECT pce.id, pce.contact_method, pce.contacted_at,
                          seller.full_name AS seller_name, seller.email AS seller_email,
                          buyer.full_name AS buyer_name, buyer.email AS buyer_email,
                          c.name AS city, p.id AS property_id
                   ${joins} ${where}
                   ORDER BY pce.contacted_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const countQuery = `SELECT COUNT(*) ${joins} ${where}`

    const [eventsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, countParams)
    ])

    return {
        events: eventsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
}

export async function logAdminAction(adminId, action, targetType, targetId, details = null) {
    await pool.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, action, targetType, targetId, details]
    )
}

export async function getActivityLog(page = 1) {
    const limit = 30
    const offset = (page - 1) * limit
    const result = await pool.query(`
        SELECT al.*, u.full_name AS admin_name
        FROM admin_activity_log al
        JOIN users u ON al.admin_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset])

    const countResult = await pool.query('SELECT COUNT(*) FROM admin_activity_log')

    return {
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
}

export async function getSecurityLogs(page = 1) {
    const limit = 30
    const offset = (page - 1) * limit
    const result = await pool.query(`
        SELECT sl.*, u.full_name AS user_name
        FROM security_logs sl
        LEFT JOIN users u ON sl.user_id = u.id
        ORDER BY sl.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset])

    const countResult = await pool.query('SELECT COUNT(*) FROM security_logs')

    return {
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
}

export async function getAvgPriceByType() {
    const result = await pool.query(`
        SELECT pt.name as label, ROUND(AVG(p.price))::INT as value
        FROM properties p
        JOIN property_types pt ON p.type_id = pt.id
        WHERE p.deleted_at IS NULL
        GROUP BY pt.name
    `)
    return result.rows
}

export async function getPropertyConditionDist() {
    const result = await pool.query(`
        SELECT condition as label, COUNT(*)::INT as count
        FROM properties
        WHERE deleted_at IS NULL
        GROUP BY condition
    `)
    return result.rows
}

export async function getMonthlySalesTrend() {
    const result = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', sold_at), 'YYYY-MM') AS month,
            COUNT(*)::INT AS count,
            COALESCE(SUM(sold_price), 0)::BIGINT as total_value
        FROM properties
        WHERE sold_at IS NOT NULL
        GROUP BY DATE_TRUNC('month', sold_at)
        ORDER BY DATE_TRUNC('month', sold_at)
    `)
    return result.rows
}

export async function getMonthlyViewsTrend() {
    const result = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', viewed_at), 'YYYY-MM') AS month,
            COUNT(*)::INT AS count
        FROM property_views
        WHERE viewed_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', viewed_at)
        ORDER BY DATE_TRUNC('month', viewed_at)
    `)
    return result.rows
}

export async function getPendingSellerCount() {
    const result = await pool.query(
        "SELECT COUNT(*)::INT FROM seller_profile WHERE status = 'pending'"
    )
    return parseInt(result.rows[0].count)
}

export async function getSoldPropertiesList(page = 1) {
    const limit = 20
    const offset = (page - 1) * limit
    
    const query = `
        SELECT 
            p.id, p.sold_at, p.sold_price, p.price as original_price,
            pt.name as type, c.name as city, d.name as district,
            seller.full_name as seller_name, seller.email as seller_email,
            buyer.full_name as buyer_name, buyer.email as buyer_email
        FROM properties p
        JOIN users seller ON p.seller_id = seller.id
        JOIN cities c ON p.city_id = c.id
        JOIN districts d ON p.district_id = d.id
        JOIN property_types pt ON p.type_id = pt.id
        JOIN purchase_offers po ON po.property_id = p.id AND po.status = 'completed'
        JOIN users buyer ON po.buyer_id = buyer.id
        WHERE p.sold_at IS NOT NULL
        ORDER BY p.sold_at DESC
        LIMIT $1 OFFSET $2
    `
    const countQuery = `
        SELECT COUNT(*) 
        FROM properties p
        JOIN purchase_offers po ON po.property_id = p.id AND po.status = 'completed'
        WHERE p.sold_at IS NOT NULL
    `

    const [rows, count] = await Promise.all([
        pool.query(query, [limit, offset]),
        pool.query(countQuery)
    ])

    return {
        properties: rows.rows,
        total: parseInt(count.rows[0].count),
        page,
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
    }
}

export async function getLeadMethodDistribution() {
    const result = await pool.query(`
        SELECT contact_method as label, COUNT(*)::INT as count
        FROM property_contact_events
        GROUP BY contact_method
    `)
    return result.rows
}

export async function getTopPerformingProperties() {
    const result = await pool.query(`
        SELECT p.id, pt.name as type, c.name as city, d.name as district, 
               (SELECT COUNT(*)::INT FROM property_views pv WHERE pv.property_id = p.id) as views,
               (SELECT COUNT(*)::INT FROM property_contact_events pce WHERE pce.property_id = p.id) as leads,
               (SELECT COUNT(*)::INT FROM saved s WHERE s.property_id = p.id) as saves
        FROM properties p
        JOIN cities c ON p.city_id = c.id
        JOIN districts d ON p.district_id = d.id
        JOIN property_types pt ON p.type_id = pt.id
        WHERE p.deleted_at IS NULL
        ORDER BY views DESC
        LIMIT 5
    `)
    return result.rows
}

export async function getOfferStatusDistribution() {
    const result = await pool.query(`
        SELECT status as label, COUNT(*)::INT as count
        FROM purchase_offers
        GROUP BY status
    `)
    return result.rows
}

export async function getAvgTimeToSell() {
    const result = await pool.query(`
        SELECT pt.name as label, ROUND(AVG(EXTRACT(EPOCH FROM (sold_at - created_at))/86400))::INT as value
        FROM properties p
        JOIN property_types pt ON p.type_id = pt.id
        WHERE sold_at IS NOT NULL
        GROUP BY pt.name
    `)
    return result.rows
}

export async function getSellerLeaderboard() {
    const result = await pool.query(`
        SELECT u.full_name as name, COUNT(p.id)::INT as total_listings,
               COUNT(p.id) FILTER (WHERE p.sold_at IS NOT NULL)::INT as sold_count,
               COALESCE(SUM(p.sold_price), 0)::BIGINT as total_revenue
        FROM users u
        JOIN properties p ON u.id = p.seller_id
        WHERE u.role = 'seller' AND p.deleted_at IS NULL
        GROUP BY u.id, u.full_name
        ORDER BY total_revenue DESC
        LIMIT 5
    `)
    return result.rows
}
