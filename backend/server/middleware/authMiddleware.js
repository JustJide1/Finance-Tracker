const jwt = require("jsonwebtoken");

// Cache decoded JWT payloads to avoid redundant crypto operations on burst
// requests (e.g. dashboard loading several endpoints simultaneously).
// Key: raw token string  Value: { payload, exp (ms timestamp) }
const tokenCache = new Map();

// Purge expired entries every 5 minutes so the Map stays bounded.
setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of tokenCache) {
        if (now > entry.exp) tokenCache.delete(token);
    }
}, 5 * 60 * 1000).unref(); // .unref() so this timer doesn't keep the process alive

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token, unauthorized" });

    const cached = tokenCache.get(token);
    if (cached) {
        if (Date.now() > cached.exp) {
            tokenCache.delete(token);
        } else {
            req.user = cached.payload;
            return next();
        }
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Cache until the token's own expiry or 1 minute, whichever comes first.
        // The 1-minute ceiling means a revoked/logged-out token stops being accepted quickly.
        const cacheExp = Math.min(decoded.exp * 1000, Date.now() + 60_000);
        tokenCache.set(token, { payload: decoded, exp: cacheExp });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: "Token invalid or expired" });
    }
};
