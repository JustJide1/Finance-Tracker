const CategoryCorrection = require("../models/CategoryCorrection");

const cache = new Map(); // userId (string) → { data, expiresAt }
const TTL_MS = 60_000;   // 60 seconds

// Purge expired entries every 5 minutes to prevent unbounded growth on long-running servers.
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now > entry.expiresAt) cache.delete(key);
    }
}, 5 * 60 * 1000).unref();

exports.getRecentCorrections = async (userId) => {
    const entry = cache.get(userId);
    if (entry && Date.now() < entry.expiresAt) return entry.data;

    const data = await CategoryCorrection.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("description originalCategory correctedCategory")
        .lean();

    cache.set(userId, { data, expiresAt: Date.now() + TTL_MS });
    return data;
};

exports.invalidate = (userId) => cache.delete(userId);
