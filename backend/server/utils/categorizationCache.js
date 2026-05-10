// In-memory cache for AI categorization results.
// The same description always maps to the same category regardless of user,
// so we can safely cache globally and skip Gemini on repeat descriptions.
// Uses simple FIFO eviction once MAX_ENTRIES is reached.

const MAX_ENTRIES = 1_000;
const cache = new Map(); // normalizedDesc → category

exports.getCachedCategory = (description) =>
    cache.get(description.toLowerCase().trim()) ?? null;

exports.setCachedCategory = (description, category) => {
    if (cache.size >= MAX_ENTRIES) {
        cache.delete(cache.keys().next().value); // evict oldest
    }
    cache.set(description.toLowerCase().trim(), category);
};
