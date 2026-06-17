import { Router } from "express"
import { isAuthenticated } from "../middlewares/session.js"
import { isAdmin } from "../middlewares/adminAuth.js"
import { 
    getStats, getRecent, listUsers, getUser, changeRole, removeUser, 
    listProperties, updateProperty, removeProperty, getReports, 
    getSellerRequests, approveSeller, rejectSeller, getPropertyDetail, 
    getContacts, getAdminActivityLog, getNotifications, listSoldProperties,
    getSettings, updateSettings, approveProperty, rejectProperty, approveAllProperties
} from "../controllers/adminController.js"

const router = Router()

router.get("/admin/stats", isAuthenticated, isAdmin, getStats)
router.get("/admin/recent", isAuthenticated, isAdmin, getRecent)
router.get("/admin/reports", isAuthenticated, isAdmin, getReports)
router.get("/admin/notifications", isAuthenticated, isAdmin, getNotifications)
router.get("/admin/activity-log", isAuthenticated, isAdmin, getAdminActivityLog)
router.get("/admin/contacts", isAuthenticated, isAdmin, getContacts)
router.get("/admin/sold-properties", isAuthenticated, isAdmin, listSoldProperties)

router.get("/admin/settings", isAuthenticated, isAdmin, getSettings)
router.patch("/admin/settings", isAuthenticated, isAdmin, updateSettings)

router.get("/admin/seller-requests", isAuthenticated, isAdmin, getSellerRequests)
router.post("/admin/seller-requests/:id/approve", isAuthenticated, isAdmin, approveSeller)
router.post("/admin/seller-requests/:id/reject", isAuthenticated, isAdmin, rejectSeller)

router.get("/admin/users", isAuthenticated, isAdmin, listUsers)
router.get("/admin/users/:id", isAuthenticated, isAdmin, getUser)
router.patch("/admin/users/:id/role", isAuthenticated, isAdmin, changeRole)
router.delete("/admin/users/:id", isAuthenticated, isAdmin, removeUser)

router.get("/admin/properties", isAuthenticated, isAdmin, listProperties)
router.get("/admin/properties/:id", isAuthenticated, isAdmin, getPropertyDetail)
router.patch("/admin/properties/:id", isAuthenticated, isAdmin, updateProperty)
router.delete("/admin/properties/:id", isAuthenticated, isAdmin, removeProperty)
router.post("/admin/properties/approve-all", isAuthenticated, isAdmin, approveAllProperties)
router.post("/admin/properties/:id/approve", isAuthenticated, isAdmin, approveProperty)
router.post("/admin/properties/:id/reject", isAuthenticated, isAdmin, rejectProperty)

export default router
