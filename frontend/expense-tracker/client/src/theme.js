export const C = {
    bg:           "#0f172a",
    surface:      "#1e293b",
    elevated:     "#334155",
    border:       "#334155",
    borderFocus:  "#6366f1",

    accent:       "#6366f1",
    accentHover:  "#818cf8",
    accentDark:   "#4f46e5",
    accentMuted:  "rgba(99,102,241,0.15)",

    income:       "#10b981",
    incomeSubtle: "rgba(16,185,129,0.12)",
    expense:      "#f43f5e",
    expenseSubtle:"rgba(244,63,94,0.12)",
    warning:      "#f59e0b",
    warningSubtle:"rgba(245,158,11,0.12)",

    textPrimary:  "#f1f5f9",
    textSecondary:"#94a3b8",
    textMuted:    "#64748b",
    white:        "#ffffff",

    grad: {
        accent:  "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        income:  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        expense: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
        warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
};

export const card = {
    background:   C.surface,
    borderRadius: "clamp(12px, 2vw, 16px)",
    padding:      "clamp(16px, 3vw, 24px)",
    border:       `1px solid ${C.border}`,
    boxShadow:    "0 1px 3px rgba(0,0,0,0.3)",
};

export const input = {
    padding:      "11px 14px",
    fontSize:     14,
    border:       `1.5px solid ${C.border}`,
    borderRadius: 12,
    outline:      "none",
    background:   C.elevated,
    color:        C.textPrimary,
    fontFamily:   "inherit",
};
