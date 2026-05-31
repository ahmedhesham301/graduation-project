export function isAdmin(req, res, next) {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" })
    }
    next()
}
