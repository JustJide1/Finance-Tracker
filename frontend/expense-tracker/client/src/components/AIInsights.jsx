import { useState, memo } from "react";
import { useAI } from "../hooks/useAI";

function AIInsights() {
    const [insights, setInsights] = useState([]);
    const [anomaly, setAnomaly] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const { getInsights, loading } = useAI();

    const handleFetch = async () => { setHasLoaded(true); await fetchAIData(); };
    const fetchAIData = async () => {
        const data = await getInsights();
        if (data) { setInsights(data.insights); setAnomaly(data.anomaly); }
    };

    return (
        <div style={S.card}>
            <div style={S.header}>
                <h3 style={S.title}>AI Insights</h3>
                <button style={S.refreshBtn} onClick={fetchAIData} disabled={loading} title="Refresh">
                    {loading ? "..." : "↻"}
                </button>
            </div>

            {anomaly && (
                <div style={S.anomaly}>
                    <span style={S.anomalyText}>{anomaly}</span>
                </div>
            )}

            {!hasLoaded ? (
                <div style={S.empty}>
                    <p style={S.emptyText}>Click to generate AI-powered spending insights</p>
                    <button style={S.generateBtn} onClick={handleFetch}>Generate Insights</button>
                </div>
            ) : loading ? (
                <p style={S.loadingText}>Analyzing your spending...</p>
            ) : insights.length === 0 ? (
                <p style={S.loadingText}>Add more transactions to unlock insights.</p>
            ) : (
                <div style={S.insightsList}>
                    {insights.map((insight, i) => (
                        <div key={i} style={S.insightItem}>
                            <span style={S.bullet}>{i + 1}</span>
                            <span style={S.insightText}>{insight}</span>
                        </div>
                    ))}
                </div>
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
        alignItems: "center",
        marginBottom: "1.25rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #E5E7EB",
    },
    title: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#111111", margin: 0 },
    refreshBtn: {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        width: 32,
        height: 32,
        color: "#6B7280",
        cursor: "pointer",
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    anomaly: {
        padding: "0.75rem 1rem",
        background: "rgba(217,119,6,0.08)",
        border: "1px solid rgba(217,119,6,0.2)",
        borderRadius: 10,
        marginBottom: "1rem",
    },
    anomalyText: { fontSize: 13, color: "#D97706", lineHeight: 1.5 },
    empty: { textAlign: "center", padding: "2rem 0" },
    emptyText: { fontSize: 13, color: "#9CA3AF", marginBottom: "1rem" },
    loadingText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "2rem 0" },
    generateBtn: {
        padding: "10px 24px",
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
    },
    insightsList: { display: "flex", flexDirection: "column", gap: "0.625rem" },
    insightItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.75rem",
        background: "#F9FAFB",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
    },
    bullet: {
        width: 22,
        height: 22,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
    },
    insightText: { fontSize: 13, lineHeight: 1.6, color: "#374151" },
};

export default memo(AIInsights);
