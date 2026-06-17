import crypto from "crypto";

export function csrfProtection(req, res, next) {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    const cookies = parseCookies(req.headers.cookie);
    let csrfToken = cookies['csrf-token'];

    // Generate a CSRF token cookie if not present
    if (!csrfToken) {
        csrfToken = crypto.randomBytes(24).toString('hex');
        res.cookie('csrf-token', csrfToken, {
            sameSite: 'lax',
            secure: process.env.ENV === 'prod',
            path: '/'
        });
    }

    // Exempt read-only HTTP methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Exempt health status checks
    const path = req.path || req.originalUrl || "";
    if (path.includes('/api/health') || path === '/health') {
        return next();
    }

    // Extract CSRF token from custom header
    const headerToken = req.headers['x-csrf-token'];

    if (!headerToken || headerToken !== csrfToken) {
        return res.status(403).json({ error: "Invalid or missing CSRF token. Request aborted." });
    }

    next();
}

function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        if (parts.length >= 2) {
            list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
        }
    });
    return list;
}
