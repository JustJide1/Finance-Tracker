// ─────────────────────────────────────────────────────────────────────────────
//  Design Token System — Green Finance Theme
//  Usage rule: always reference a token, never a raw hex value in components.
// ─────────────────────────────────────────────────────────────────────────────

export const C = {
    // ── Canvas / backgrounds ──────────────────────────────────────────────────
    canvas:       "#EFEFEF",          // App outer background
    surface:      "#FFFFFF",          // Card / panel backgrounds
    surfaceAlt:   "#F5F5F5",          // Slightly-off-white for nested elements / inputs
    border:       "#D1D5DB",          // Subtle borders between elements
    borderFocus:  "#2D6A4F",          // Focus ring — primary accent dark

    // ── Primary accent (hero, CTA, active states) ────────────────────────────
    accent:       "#2D6A4F",          // Primary action buttons, active nav indicator
    accentDark:   "#1A4731",          // Hero card gradient start
    accentHover:  "#1A4731",          // Hover state for primary buttons
    accentLight:  "#C8E6C2",          // Light tint: chart fills, bar highlights
    accentMid:    "#A8D5A2",          // Mid-light: sparklines, secondary chart fills

    // ── Semantic transaction colours (kept for income / expense distinction) ──
    income:        "#2D6A4F",         // Positive amounts  → use accent
    incomeSubtle:  "rgba(45,106,79,0.10)",
    expense:       "#DC2626",         // Negative amounts  → vivid red on light bg
    expenseSubtle: "rgba(220,38,38,0.08)",
    warning:       "#D97706",         // Budget warnings
    warningSubtle: "rgba(217,119,6,0.10)",

    // ── Text ─────────────────────────────────────────────────────────────────
    textPrimary:   "#111111",         // Page titles, stat values (≥7:1 on #EFEFEF)
    textSecondary: "#6B7280",         // Labels, meta, inactive nav  (≥4.5:1 on #FFFFFF)
    textMuted:     "#9CA3AF",         // Placeholders, hints
    textOnDark:    "#FFFFFF",         // Text that sits on the dark hero/accent bg

    // ── Positive badge ────────────────────────────────────────────────────────
    badgePosText:  "#065F46",         // "+15.76%" pill text
    badgePosBg:    "#D1FAE5",         // "+15.76%" pill background

    // ── Chart grid ────────────────────────────────────────────────────────────
    chartGrid:     "#E5E7EB",         // Horizontal grid lines

    // ── Hero gradient (StatCards primary card) ────────────────────────────────
    grad: {
        hero:    "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        income:  "linear-gradient(135deg, #2D6A4F 0%, #1A4731 100%)",
        expense: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
        warning: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
    },
};

// ── Shared card shell ─────────────────────────────────────────────────────────
export const card = {
    background:   C.surface,
    borderRadius: "clamp(12px, 2vw, 16px)",
    padding:      "clamp(16px, 3vw, 24px)",
    border:       `1px solid ${C.border}`,
    boxShadow:    "0 1px 4px rgba(0,0,0,0.07)",
};

// ── Shared input shell ────────────────────────────────────────────────────────
export const input = {
    padding:      "11px 14px",
    fontSize:     14,
    border:       `1.5px solid ${C.border}`,
    borderRadius: 12,
    outline:      "none",
    background:   C.surfaceAlt,
    color:        C.textPrimary,
    fontFamily:   "inherit",
};
