import { useEffect, useState } from "react";
import { aiService } from "../api/aiService";

function formatHeader(generatedAt, period) {
    const date = new Date(generatedAt).toLocaleDateString("en-NG", {
        day: "2-digit", month: "short", year: "numeric",
    });
    const label = period === "week" ? "Weekly"
        : period === "month" ? "Monthly"
        : period === "year"  ? "Yearly"
        : "All time";
    return `${date} · ${label}`;
}

function TimelineEntry({ entry, isLatest }) {
    const [expanded, setExpanded] = useState(false);
    const { period, insights, generatedAt } = entry;

    return (
        <div style={S.entryRow}>
            {/* Left border + dot */}
            <div style={S.rail}>
                <div style={S.dot} />
                <div style={S.line} />
            </div>

            {/* Content */}
            <div style={S.entryContent}>
                <div style={S.entryHeader}>
                    <span style={S.entryDate}>{formatHeader(generatedAt, period)}</span>
                    {isLatest && <span style={S.latestBadge}>Latest</span>}
                </div>

                {/* First insight always visible */}
                <p style={S.insightText}>{insights[0]}</p>

                {/* Expanded list */}
                {expanded && insights.length > 1 && (
                    <ol style={S.insightList}>
                        {insights.slice(1).map((ins, i) => (
                            <li key={i} style={S.insightItem}>{ins}</li>
                        ))}
                    </ol>
                )}

                {insights.length > 1 && (
                    <button style={S.toggle} onClick={() => setExpanded(x => !x)}>
                        {expanded ? "Collapse ▴" : `Show all ${insights.length} ▾`}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function InsightHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        aiService.getInsightHistory()
            .then(data => setHistory((data.history || []).slice(0, 10)))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={S.card}>
            <style>{`@keyframes ihShimmer{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

            {/* Card header */}
            <div style={S.header}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ marginRight: 7, flexShrink: 0 }}>
                    <path d="M8 1 L9.15 6.85 L15 8 L9.15 9.15 L8 15 L6.85 9.15 L1 8 L6.85 6.85 Z" fill="#2D6A4F"/>
                </svg>
                <h3 style={S.title}>Insight History</h3>
            </div>

            {loading ? (
                <div style={S.shimmer} />
            ) : history.length === 0 ? (
                <p style={S.empty}>
                    Your AI insight history will appear here after your first analysis.
                </p>
            ) : (
                <div style={S.timeline}>
                    {history.map((entry, i) => (
                        <TimelineEntry key={i} entry={entry} isLatest={i === 0} />
                    ))}
                </div>
            )}
        </div>
    );
}

const S = {
    card: {
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
    },
    shimmer: {
        background: "#E5E7EB",
        borderRadius: 8,
        height: 200,
        animation: "ihShimmer 1.4s ease-in-out infinite",
    },
    header: {
        display: "flex",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 14,
        borderBottom: "1px solid #E5E7EB",
    },
    title: {
        margin: 0,
        fontSize: 15,
        fontWeight: 600,
        color: "#111111",
    },
    empty: {
        fontSize: 13,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 1.6,
        margin: "8px 0 0",
    },
    timeline: {
        display: "flex",
        flexDirection: "column",
    },
    entryRow: {
        display: "flex",
        gap: 12,
    },
    rail: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
        width: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#2D6A4F",
        flexShrink: 0,
        marginTop: 3,
    },
    line: {
        flex: 1,
        width: 2,
        background: "#E5E7EB",
        marginTop: 4,
        minHeight: 16,
    },
    entryContent: {
        flex: 1,
        paddingBottom: 20,
    },
    entryHeader: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    entryDate: {
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
    },
    latestBadge: {
        background: "rgba(45,106,79,0.1)",
        color: "#2D6A4F",
        fontSize: 11,
        borderRadius: 20,
        padding: "2px 8px",
        fontWeight: 600,
    },
    insightText: {
        margin: 0,
        fontSize: 13,
        color: "#4B5563",
        lineHeight: 1.55,
    },
    insightList: {
        margin: "8px 0 0",
        paddingLeft: 18,
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    insightItem: {
        fontSize: 13,
        color: "#4B5563",
        lineHeight: 1.55,
    },
    toggle: {
        marginTop: 8,
        background: "none",
        border: "none",
        padding: 0,
        fontSize: 12,
        color: "#2D6A4F",
        fontWeight: 600,
        cursor: "pointer",
    },
};
