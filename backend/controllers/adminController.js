import { 
    getDashboardStats, getRecentUsers, getRecentProperties, getAllUsers, 
    getUserById, updateUserRole, deleteUser, getAllProperties, 
    updatePropertyAdmin, deletePropertyAdmin, getUserRegistrationsByMonth, 
    getPropertyListingsByMonth, getTopCities, getPropertyDistribution, 
    getUserDistribution, getContactsByMonth, getPendingSellerRequests, 
    approveSellerRequest, rejectSellerRequest, getPropertyDetails, 
    getPropertyMedia, getContactEvents, logAdminAction, getActivityLog, 
    getPendingSellerCount, getAvgPriceByType, getPropertyConditionDist, 
    getMonthlySalesTrend, getMonthlyViewsTrend, getSoldPropertiesList,
    getSiteSettings, updateSiteSetting, approvePropertyListing, rejectPropertyListing, approveAllPropertyListings,
    getLeadMethodDistribution, getTopPerformingProperties, getOfferStatusDistribution,
    getAvgTimeToSell, getSellerLeaderboard, getSecurityLogs
} from "../models/adminModel.js"
import { createNotification } from "../models/notificationModel.js"
import { pool } from "../database/postgresql.js"

export async function getStats(req, res) {
    try {
        const stats = await getDashboardStats()
        res.json(stats)
    } catch (err) {
        console.error("Admin stats error:", err)
        res.status(500).json({ error: "Failed to load dashboard stats" })
    }
}

export async function getRecent(req, res) {
    try {
        const [users, properties] = await Promise.all([
            getRecentUsers(10),
            getRecentProperties(10)
        ])
        res.json({ users, properties })
    } catch (err) {
        console.error("Admin recent error:", err)
        res.status(500).json({ error: "Failed to load recent data" })
    }
}

export async function listUsers(req, res) {
    try {
        const { page = 1, search = '', role = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query
        const result = await getAllUsers(Number(page), search, role, sortBy, sortOrder)
        res.json(result)
    } catch (err) {
        console.error("Admin list users error:", err)
        res.status(500).json({ error: "Failed to load users" })
    }
}

export async function getUser(req, res) {
    try {
        const user = await getUserById(req.params.id)
        if (!user) return res.status(404).json({ error: "User not found" })
        res.json(user)
    } catch (err) {
        console.error("Admin get user error:", err)
        res.status(500).json({ error: "Failed to load user" })
    }
}

export async function changeRole(req, res) {
    try {
        const { role } = req.body
        if (!['buyer', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({ error: "Invalid role" })
        }
        if (Number(req.params.id) === req.session.userID) {
            return res.status(400).json({ error: "Cannot change your own role" })
        }
        const user = await updateUserRole(req.params.id, role)
        if (!user) return res.status(404).json({ error: "User not found" })
        res.json(user)
    } catch (err) {
        console.error("Admin change role error:", err)
        res.status(500).json({ error: "Failed to update role" })
    }
}

export async function removeUser(req, res) {
    try {
        if (Number(req.params.id) === req.session.userID) {
            return res.status(400).json({ error: "Cannot delete yourself" })
        }
        const deleted = await deleteUser(req.params.id)
        if (!deleted) return res.status(404).json({ error: "User not found" })
        res.status(204).send()
    } catch (err) {
        console.error("Admin delete user error:", err)
        res.status(500).json({ error: "Failed to delete user" })
    }
}

export async function listProperties(req, res) {
    try {
        const { page = 1, search = '', city = '', typeId = null, sortBy = 'created_at', sortOrder = 'DESC', status = '' } = req.query
        const result = await getAllProperties(Number(page), search, city, typeId ? Number(typeId) : null, sortBy, sortOrder, status)
        res.json(result)
    } catch (err) {
        console.error("Admin list properties error:", err)
        res.status(500).json({ error: "Failed to load properties" })
    }
}

export async function updateProperty(req, res) {
    try {
        const updated = await updatePropertyAdmin(req.params.id, req.body)
        if (!updated) return res.status(404).json({ error: "Property not found" })
        await logAdminAction(req.session.userID, 'update_property', 'property', Number(req.params.id), JSON.stringify(req.body))
        res.json(updated)
    } catch (err) {
        console.error("Admin update property error:", err)
        res.status(500).json({ error: "Failed to update property" })
    }
}

export async function removeProperty(req, res) {
    try {
        const deleted = await deletePropertyAdmin(req.params.id)
        if (!deleted) return res.status(404).json({ error: "Property not found" })
        res.status(204).send()
    } catch (err) {
        console.error("Admin delete property error:", err)
        res.status(500).json({ error: "Failed to delete property" })
    }
}

export async function getReports(req, res) {
    try {
        const [
            registrations, listings, topCities, propertyDist, userDist, 
            contacts, avgPriceByType, conditionDist, salesTrends, viewsTrends,
            leadMethods, topProperties, offerStatuses, timeToSell, sellers
        ] = await Promise.all([
            getUserRegistrationsByMonth(),
            getPropertyListingsByMonth(),
            getTopCities(),
            getPropertyDistribution(),
            getUserDistribution(),
            getContactsByMonth(),
            getAvgPriceByType(),
            getPropertyConditionDist(),
            getMonthlySalesTrend(),
            getMonthlyViewsTrend(),
            getLeadMethodDistribution(),
            getTopPerformingProperties(),
            getOfferStatusDistribution(),
            getAvgTimeToSell(),
            getSellerLeaderboard()
        ])
        res.json({ 
            registrations, listings, topCities, propertyDist, userDist, 
            contacts, avgPriceByType, conditionDist, salesTrends, viewsTrends,
            leadMethods, topProperties, offerStatuses, timeToSell, sellers
        })
    } catch (err) {
        console.error("Admin reports error:", err)
        res.status(500).json({ error: "Failed to load reports" })
    }
}

export async function getSellerRequests(req, res) {
    try {
        const requests = await getPendingSellerRequests()
        res.json(requests)
    } catch (err) {
        console.error("Admin seller requests error:", err)
        res.status(500).json({ error: "Failed to load seller requests" })
    }
}

export async function approveSeller(req, res) {
    try {
        const userId = Number(req.params.id)
        await approveSellerRequest(userId)
        await logAdminAction(req.session.userID, 'approve_seller', 'user', userId)
        try {
            await createNotification(userId, 'seller_approved', 'Your seller application was approved!', 'You can now list properties for sale.', null, req.session.userID)
        } catch (_) {}
        res.json({ message: "Seller approved" })
    } catch (err) {
        console.error("Admin approve seller error:", err)
        res.status(500).json({ error: "Failed to approve seller" })
    }
}

export async function rejectSeller(req, res) {
    try {
        const { reason } = req.body
        if (!reason) return res.status(400).json({ error: "Rejection reason is required" })
        const userId = Number(req.params.id)
        await rejectSellerRequest(userId, reason)
        await logAdminAction(req.session.userID, 'reject_seller', 'user', userId, reason)
        try {
            await createNotification(userId, 'seller_rejected', 'Your seller application was rejected', reason || 'Your application did not meet the requirements.', null, req.session.userID)
        } catch (_) {}
        res.json({ message: "Seller rejected" })
    } catch (err) {
        console.error("Admin reject seller error:", err)
        res.status(500).json({ error: "Failed to reject seller" })
    }
}

export async function getPropertyDetail(req, res) {
    try {
        const property = await getPropertyDetails(req.params.id)
        if (!property) return res.status(404).json({ error: "Property not found" })
        const media = await getPropertyMedia(req.params.id)
        res.json({ ...property, media })
    } catch (err) {
        console.error("Admin property detail error:", err)
        res.status(500).json({ error: "Failed to load property" })
    }
}

export async function getContacts(req, res) {
    try {
        const { page = 1, from, to } = req.query
        const result = await getContactEvents(Number(page), from || null, to || null)
        res.json(result)
    } catch (err) {
        console.error("Admin contacts error:", err)
        res.status(500).json({ error: "Failed to load contacts" })
    }
}

export async function getAdminActivityLog(req, res) {
    try {
        const { page = 1 } = req.query
        const result = await getActivityLog(Number(page))
        res.json(result)
    } catch (err) {
        console.error("Admin activity log error:", err)
        res.status(500).json({ error: "Failed to load activity log" })
    }
}

export async function getNotifications(req, res) {
    try {
        const pendingSellers = await getPendingSellerCount()
        res.json({ pendingSellers })
    } catch (err) {
        console.error("Admin notifications error:", err)
        res.status(500).json({ error: "Failed to load notifications" })
    }
}

export async function listSoldProperties(req, res) {
    try {
        const { page = 1 } = req.query
        const result = await getSoldPropertiesList(Number(page))
        res.json(result)
    } catch (err) {
        console.error("Admin list sold properties error:", err)
        res.status(500).json({ error: "Failed to load sold properties" })
    }
}

export async function getSettings(req, res) {
    try {
        const settings = await getSiteSettings()
        res.json(settings)
    } catch (err) {
        console.error("Admin get settings error:", err)
        res.status(500).json({ error: "Failed to load settings" })
    }
}

export async function updateSettings(req, res) {
    try {
        const { settings } = req.body
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: "Invalid settings data" })
        }
        for (const [key, value] of Object.entries(settings)) {
            await updateSiteSetting(key, String(value))
        }
        await logAdminAction(req.session.userID, 'update_settings', 'system', null, JSON.stringify(settings))
        res.json({ message: "Settings updated successfully" })
    } catch (err) {
        console.error("Admin update settings error:", err)
        res.status(500).json({ error: "Failed to update settings" })
    }
}

export async function approveProperty(req, res) {
    try {
        await approvePropertyListing(req.params.id)
        await logAdminAction(req.session.userID, 'approve_property', 'property', Number(req.params.id))
        res.json({ message: "Property approved" })
    } catch (err) {
        console.error("Admin approve property error:", err)
        res.status(500).json({ error: "Failed to approve property" })
    }
}

export async function rejectProperty(req, res) {
    try {
        const { reason } = req.body
        if (!reason) return res.status(400).json({ error: "Rejection reason is required" })
        await rejectPropertyListing(req.params.id, reason)
        await logAdminAction(req.session.userID, 'reject_property', 'property', Number(req.params.id), reason)
        res.json({ message: "Property rejected" })
    } catch (err) {
        console.error("Admin reject property error:", err)
        res.status(500).json({ error: "Failed to reject property" })
    }
}

export async function approveAllProperties(req, res) {
    try {
        await approveAllPropertyListings()
        await logAdminAction(req.session.userID, 'approve_all_properties', 'property', null)
        res.json({ message: "All pending properties approved successfully" })
    } catch (err) {
        console.error("Admin approve all properties error:", err)
        res.status(500).json({ error: "Failed to approve all properties" })
    }
}

export async function getAdminSecurityLogs(req, res) {
    try {
        const { page = 1 } = req.query
        const result = await getSecurityLogs(Number(page))
        res.json(result)
    } catch (err) {
        console.error("Admin security logs error:", err)
        res.status(500).json({ error: "Failed to load security logs" })
    }
}
