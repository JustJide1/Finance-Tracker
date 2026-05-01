import { useState, memo } from "react";
import { useAI } from "../hooks/useAI";

function AIInsights() {
    const [insights, setInsights] = useState([]);
    const [anomaly, setAnomaly] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    
    const { getInsights, loading } = useAI();

    const handleFetch = async () => {
        setHasLoaded(true);
        await fetchAIData();
    };

    const fetchAIData = async () => {
        const data = await getInsights();
        if (data) {
            setInsights(data.insights);
            setAnomaly(data.anomaly);
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3 style={styles.title}>AI Insights</h3>
                <button style={styles.refreshBtn} onClick={fetchAIData} disabled={loading} title="Refresh">
                    {loading ? "..." : "↻"}
                </button>
            </div>

            {anomaly && (
                <div style={styles.anomaly}>
                    <span style={styles.anomalyText}>{anomaly}</span>
                </div>
            )}

            {!hasLoaded ? (
                <div style={styles.empty}>
                    <p style={styles.emptyText}>Click to generate AI-powered spending insights</p>
                    <button style={styles.generateBtn} onClick={handleFetch}>
                        Generate Insights
                    </button>
                </div>
            ) : loading ? (
                <p style={styles.loadingText}>Analyzing your spending...</p>
            ) : insights.length === 0 ? (
                <p style={styles.loadingText}>Add more transactions to unlock insights.</p>
            ) : (
                <div style={styles.insightsList}>
                    {insights.map((insight, i) => (
                        <div key={i} style={styles.insightItem}>
                            <span style={styles.bullet}>{i + 1}</span>
                            <span style={styles.insightText}>{insight}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    card: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.25rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #334155",
    },
    title: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#f1f5f9", margin: 0 },
    refreshBtn: {
        background: "#334155",
        border: "none",
        borderRadius: 8,
        width: 32,
        height: 32,
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    anomaly: {
        padding: "0.75rem 1rem",
        background: "rgba(245,158,11,0.1)",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: 10,
        marginBottom: "1rem",
    },
    anomalyText: { fontSize: 13, color: "#fbbf24", lineHeight: 1.5 },
    empty: { textAlign: "center", padding: "2rem 0" },
    emptyText: { fontSize: 13, color: "#64748b", marginBottom: "1rem" },
    loadingText: { fontSize: 13, color: "#64748b", textAlign: "center", padding: "2rem 0" },
    generateBtn: {
        padding: "10px 24px",
        background: "#6366f1",
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
        background: "#334155",
        borderRadius: 10,
    },
    bullet: {
        width: 22,
        height: 22,
        background: "#6366f1",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
    },
    insightText: { fontSize: 13, lineHeight: 1.6, color: "#94a3b8" },
};

export default memo(AIInsights);
