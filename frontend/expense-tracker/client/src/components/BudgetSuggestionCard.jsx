import { useState } from "react";
import { aiService } from "../api/aiService";

// Simple shimmer rows for loading state (mirrors Skeleton.jsx patterns)
function SuggestionSkeleton() {
    const shimmer = {
        background: "linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 6,
        animation: "shimmer 1.5s infinite",
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={S.suggItem}>
                    <div style={{ ...shimmer, height: 14, width: "35%", marginBottom: 8 }} />
                    <div style={{ ...shimmer, height: 12, width: "65%" }} />
                    <div style={{ ...shimmer, height: 12, width: "50%", marginTop: 6 }} />
                </div>
            ))}
        </div>
    );
}

export default function BudgetSuggestionCard({ onApply }) {
    const [state, setState] = useState("idle"); // idle | loading | done | error
    const [data, setData] = useState(null);

    const load = async () => {
        setState("loading");
        try {
            const result = await aiService.getBudgetSuggestions();
            setData(result);
            setState("done");
        } catch {
            setState("error");
        }
    };

    const isRuleBased = data?.source === "rule-based";

    return (
        <div style={S.card}>
            <div style={S.header}>
                <div>
                    <div style={S.title}>AI Budget Recommendations</div>
                    <div style={S.subtitle}>Personalised monthly limits based on your spending history</div>
                </div>
                {state !== "loading" && (
                    <button style={S.btnGet} onClick={load} disabled={state === "loading"}>
                        {state === "idle" ? "Get Suggestions" : "Refresh"}
                    </button>
                )}
            </div>

            {state === "idle" && (
                <div style={S.emptyHint}>
                    Click "Get Suggestions" to generate AI-powered budget limits from your recent transactions.
                </div>
            )}

            {state === "loading" && <SuggestionSkeleton />}

            {state === "error" && (
                <div style={S.errorMsg}>Failed to load suggestions. Please try again.</div>
            )}

            {state === "done" && data && (
                <>
                    {data.suggestions.length === 0 ? (
                        <div style={S.emptyHint}>{data.overallTip || "Add some transactions to get personalised budget suggestions."}</div>
                    ) : (
                        <>
                            {data.overallTip && (
                                <div style={S.tipBanner}>
                                    <span style={S.tipIcon}>💡</span>
                                    <span>{data.overallTip}</span>
                                </div>
                            )}

                            {isRuleBased && (
                                <div style={S.badge}>
                                    Estimated (AI unavailable) — based on your average spending + 10% buffer
                                </div>
                            )}

                            <div style={S.list}>
                                {data.suggestions.map((s) => (
                                    <div key={s.category} style={S.suggItem}>
                                        <div style={S.suggHeader}>
                                            <span style={S.catName}>{s.category}</span>
                                            <button
                                                style={S.btnApply}
                                                onClick={() => onApply && onApply({ category: s.category, amount: s.suggestedLimit })}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        <div style={S.amountRow}>
                                            <span style={S.amtLabel}>Current avg</span>
                                            <span style={S.amtValue}>₦{s.currentSpending.toLocaleString()}</span>
                                            <span style={S.amtArrow}>→</span>
                                            <span style={S.amtLabel}>Suggested limit</span>
                                            <span style={{ ...S.amtValue, color: "#1A4731", fontWeight: 700 }}>
                                                ₦{s.suggestedLimit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={S.rationale}>{s.rationale}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

const S = {
    card: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem",
        gap: "0.75rem",
        flexWrap: "wrap",
    },
    title: { fontSize: 15, fontWeight: 600, color: "#111111" },
    subtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
    btnGet: {
        padding: "9px 16px",
        fontSize: 13,
        fontWeight: 600,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
    },
    emptyHint: { fontSize: 13, color: "#9CA3AF", padding: "1.25rem 0", textAlign: "center" },
    errorMsg: { fontSize: 13, color: "#DC2626", padding: "1rem 0", textAlign: "center" },
    tipBanner: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "flex-start",
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: 10,
        padding: "0.625rem 0.875rem",
        fontSize: 13,
        color: "#166534",
        marginBottom: "0.875rem",
        lineHeight: 1.5,
    },
    tipIcon: { flexShrink: 0, fontSize: 15, lineHeight: 1 },
    badge: {
        display: "inline-block",
        fontSize: 11,
        fontWeight: 500,
        background: "#FEF9C3",
        color: "#854D0E",
        border: "1px solid #FDE68A",
        borderRadius: 20,
        padding: "3px 10px",
        marginBottom: "0.875rem",
    },
    list: { display: "flex", flexDirection: "column", gap: "0.75rem" },
    suggItem: {
        padding: "0.875rem 1rem",
        background: "#F9FAFB",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
    },
    suggHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.5rem",
    },
    catName: { fontSize: 14, fontWeight: 600, color: "#111111" },
    btnApply: {
        fontSize: 12,
        padding: "4px 12px",
        background: "#1A4731",
        color: "#fff",
        border: "none",
        borderRadius: 7,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 500,
    },
    amountRow: {
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        flexWrap: "wrap",
        marginBottom: "0.375rem",
    },
    amtLabel: { fontSize: 11, color: "#9CA3AF" },
    amtValue: { fontSize: 13, fontWeight: 600, color: "#374151" },
    amtArrow: { fontSize: 12, color: "#D1D5DB" },
    rationale: { fontSize: 12, color: "#6B7280", lineHeight: 1.5 },
};
