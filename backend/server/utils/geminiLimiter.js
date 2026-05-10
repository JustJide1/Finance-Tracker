/**
 * Gemini API rate-limiting gateway.
 *
 * Replaces the ad-hoc generateWithRetry() that lived in aiController.js.
 * All Gemini calls across the whole process go through the single `generate()`
 * export so they share one token bucket, one concurrency counter, and one
 * circuit-breaker pause — regardless of which controller or service calls them.
 *
 * Behaviour summary
 * ─────────────────
 *  • Token bucket  — limits outgoing request rate to GEMINI_RPM_LIMIT RPM
 *                    (default 10, matching the free-tier quota).
 *  • Concurrency   — at most 3 Gemini calls in-flight simultaneously.
 *  • Queue         — callers that can't run yet are parked; they resolve
 *                    automatically once a slot opens.  Queue capacity is 50;
 *                    overflow is rejected with LIMITER_QUEUE_FULL.
 *  • 503 retry     — exponential backoff with jitter, then fallback model.
 *  • 429 handling  — parses Retry-After from the error, pauses the whole
 *                    queue, then tries the fallback model immediately.
 *  • Fallback 429  — both models quota-exceeded → throws { isQuotaError:true }.
 */

"use strict";

const { primaryModel, fallbackModel } = require("../config/geminiClient");

// ── Utility helpers ───────────────────────────────────────────────────────────

const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (maxMs = 1_000) => Math.random() * maxMs;

/**
 * Wraps a promise with a hard deadline.
 * If `promise` does not settle within `ms` milliseconds the returned promise
 * rejects with an error that carries `err.isTimeout = true`.
 * The timeout timer is always cleared so it never leaks into the event loop.
 */
function withTimeout(promise, ms, label = "request") {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            const err = new Error(`Gemini ${label} timed out after ${ms}ms`);
            err.isTimeout = true;
            reject(err);
        }, ms);
        promise.then(
            (v) => { clearTimeout(id); resolve(v); },
            (e) => { clearTimeout(id); reject(e); },
        );
    });
}

// Hard deadline for a single Gemini HTTP round-trip.
// Free-tier Gemini can be slow under load; 30 s is generous but bounded.
// Override with GEMINI_TIMEOUT_MS env var (e.g. 15000 for tighter SLA).
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS ?? "30000", 10);

/** Returns true when the error looks like an HTTP 429 / quota exceeded. */
function is429(err) {
    return (
        err?.status === 429 ||
        /429|quota.?exceeded|too.?many.?requests/i.test(err?.message ?? "")
    );
}

/** Returns true when the error looks like an HTTP 503 / service unavailable. */
function is503(err) {
    return (
        err?.status === 503 ||
        /503|service.?unavailable/i.test(err?.message ?? "")
    );
}

/**
 * Parses the Retry-After value the Gemini API embeds in 429 error objects.
 * Returns milliseconds, or null if the field isn't present / parseable.
 */
function parseRetryAfterMs(err) {
    // Google AI SDK may surface it as err.retryAfter (seconds),
    // err.errorDetails[].retryDelay (seconds string like "30s"),
    // or inside err.message as "retry after Xs".
    const candidates = [
        err?.retryAfter,
        err?.errorDetails?.[0]?.retryDelay,
    ];

    for (const raw of candidates) {
        if (raw == null) continue;
        const secs = parseFloat(String(raw));
        if (!isNaN(secs) && secs > 0) return secs * 1_000;
    }

    // Last resort: scrape "retry after 30" or "retryAfter: 60" from the message
    const match = (err?.message ?? "").match(/retry.?after[:\s]+(\d+)/i);
    if (match) return parseFloat(match[1]) * 1_000;

    return null;
}

// ── Token Bucket ──────────────────────────────────────────────────────────────

class TokenBucket {
    /**
     * @param {number} rpmLimit  Maximum requests per minute.
     */
    constructor(rpmLimit) {
        this.capacity    = rpmLimit;
        this.tokens      = rpmLimit;
        // Tokens regenerate continuously at `rpmLimit / 60 000` tokens per ms
        this.refillRate  = rpmLimit / 60_000;
        this.lastRefillAt = Date.now();
    }

    _refill() {
        const now    = Date.now();
        const earned = (now - this.lastRefillAt) * this.refillRate;
        this.tokens      = Math.min(this.capacity, this.tokens + earned);
        this.lastRefillAt = now;
    }

    /** Consume one token if available. Returns true on success. */
    tryConsume() {
        this._refill();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }

    /** Milliseconds until at least one token will be available. */
    msUntilToken() {
        this._refill();
        if (this.tokens >= 1) return 0;
        return Math.ceil((1 - this.tokens) / this.refillRate);
    }
}

// ── Rate Limiter ──────────────────────────────────────────────────────────────

class GeminiLimiter {
    /**
     * @param {object} opts
     * @param {number} [opts.rpmLimit=10]        Token-bucket capacity (requests/minute).
     * @param {number} [opts.maxConcurrency=3]   Max simultaneous Gemini calls.
     * @param {number} [opts.maxQueueSize=50]    Reject callers beyond this depth.
     */
    constructor({ rpmLimit = 10, maxConcurrency = 3, maxQueueSize = 50 } = {}) {
        this._bucket         = new TokenBucket(rpmLimit);
        this._maxConcurrency = maxConcurrency;
        this._maxQueueSize   = maxQueueSize;
        this._inflight       = 0;
        this._pausedUntil    = 0;   // epoch-ms; queue is frozen until then
        this._queue          = [];  // [{ fn, resolve, reject }]
        this._drainTimer     = null;
    }

    // ── Public ──────────────────────────────────────────────────────────────

    /**
     * Enqueue `fn` to run when a rate-limit slot is free.
     * Returns a promise that resolves / rejects with fn's result.
     *
     * @param {() => Promise<any>} fn
     * @returns {Promise<any>}
     */
    call(fn) {
        return new Promise((resolve, reject) => {
            if (this._queue.length >= this._maxQueueSize) {
                const err = new Error("LIMITER_QUEUE_FULL");
                err.isLimiterError = true;
                return reject(err);
            }
            this._queue.push({ fn, resolve, reject });
            this._drain();
        });
    }

    /**
     * Freeze the queue for `ms` milliseconds (called when a 429 is received
     * so that queued requests don't fire until the quota window has reset).
     */
    pause(ms) {
        const until = Date.now() + ms;
        if (until > this._pausedUntil) this._pausedUntil = until;
        this._scheduleDrain(ms + 100);
    }

    /** Current queue depth + inflight count (useful for monitoring). */
    status() {
        return {
            queued:     this._queue.length,
            inflight:   this._inflight,
            tokens:     +this._bucket.tokens.toFixed(2),
            pausedMs:   Math.max(0, this._pausedUntil - Date.now()),
        };
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    _canDispatch() {
        if (Date.now() < this._pausedUntil)          return false;
        if (this._inflight >= this._maxConcurrency)  return false;
        return this._bucket.tryConsume();
    }

    _drain() {
        while (this._queue.length > 0) {
            if (!this._canDispatch()) {
                // Work out how long to wait before trying again
                const pauseWait = Math.max(0, this._pausedUntil - Date.now());
                const tokenWait = this._bucket.msUntilToken();
                const concurWait = this._inflight >= this._maxConcurrency ? 100 : 0;
                const waitMs = Math.max(pauseWait, tokenWait, concurWait);
                this._scheduleDrain(waitMs + 50);
                return;
            }
            const { fn, resolve, reject } = this._queue.shift();
            this._run(fn, resolve, reject);
        }
    }

    _scheduleDrain(ms) {
        if (this._drainTimer) return; // already scheduled
        this._drainTimer = setTimeout(() => {
            this._drainTimer = null;
            this._drain();
        }, Math.max(0, ms));
    }

    _run(fn, resolve, reject) {
        this._inflight++;
        fn().then(
            (v) => { resolve(v); this._inflight--; this._drain(); },
            (e) => { reject(e);  this._inflight--; this._drain(); },
        );
    }
}

// ── Singleton limiter (one per process = one per API key) ────────────────────

const limiter = new GeminiLimiter({
    rpmLimit:       parseInt(process.env.GEMINI_RPM_LIMIT ?? "10", 10),
    maxConcurrency: 3,
    maxQueueSize:   50,
});

// ── Retry logic (runs inside a limiter slot) ──────────────────────────────────

const MAX_RETRIES = 2;

async function _attempt(prompt) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await withTimeout(
                primaryModel.generateContent(prompt),
                GEMINI_TIMEOUT_MS,
                "primary",
            );
        } catch (err) {
            if (is429(err)) {
                const retryMs = parseRetryAfterMs(err) ?? 60_000;
                limiter.pause(retryMs + jitter(2_000));
                console.warn(
                    `⚠️  Gemini 429 — pausing queue ${Math.round(retryMs / 1_000)}s. ` +
                    `Trying fallback model immediately…`
                );
                return _tryFallback(prompt);
            }

            if (is503(err)) {
                if (attempt < MAX_RETRIES) {
                    const waitMs = Math.pow(2, attempt) * 1_000 + jitter(500); // 2±0.5 s, 4±0.5 s
                    console.warn(
                        `⚠️  Gemini 503 (attempt ${attempt}/${MAX_RETRIES}) — ` +
                        `retrying in ${Math.round(waitMs)}ms…`
                    );
                    await sleep(waitMs);
                    continue;
                }
                console.warn("⚠️  Gemini 503 exhausted — trying fallback model…");
                return _tryFallback(prompt);
            }

            throw err; // non-retryable (400, auth, network, …) — surface immediately
        }
    }
}

async function _tryFallback(prompt) {
    try {
        return await withTimeout(
            fallbackModel.generateContent(prompt),
            GEMINI_TIMEOUT_MS,
            "fallback",
        );
    } catch (err) {
        if (is429(err)) {
            const quotaErr = new Error("ALL_QUOTA_EXCEEDED");
            quotaErr.isQuotaError = true;
            throw quotaErr;
        }
        throw err;
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a prompt to Gemini, respecting rate limits and retrying on transient errors.
 *
 * Usage (drop-in for model.generateContent):
 *   const result = await generate(prompt);
 *   const text   = result.response.text();
 *
 * @param   {string}          prompt
 * @returns {Promise<object>} Gemini GenerateContentResponse
 */
async function generate(prompt) {
    return limiter.call(() => _attempt(prompt));
}

// Sentinel values controllers can import to give callers a typed 503 instead of a generic 500.
const QUEUE_FULL_MSG = "LIMITER_QUEUE_FULL";
const QUOTA_EXCEEDED_MSG = "ALL_QUOTA_EXCEEDED";

module.exports = { generate, limiter, QUEUE_FULL_MSG, QUOTA_EXCEEDED_MSG };
