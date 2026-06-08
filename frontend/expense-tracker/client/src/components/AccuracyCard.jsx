import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function AccuracyCard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/ai/accuracy")
            .then(res => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={S.card}>
                <style>{`@keyframes acShimmer{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                <div style={S.shimmer} />
            </div>
        );
    }

    const {
        aiCategorized   = 0,
        accepted        = 0,
        corrected       = 0,
        accuracyRate    = null,
        recentCorrections = [],
    } = data || {};

    // SVG ring geometry
    const SIZE = 120, CX = 60, CY = 60, R = 46, SW = 8;
    const circumference = 2 * Math.PI * R;
    const ringColor = accuracyRate === null ? "#E5E7EB"
        : accuracyRate >= 80 ? "#2D6A4F"
        : accuracyRate >= 50 ? "#D97706"
        : "#DC2626";
    const dashOffset = accuracyRate === null
        ? circumference
        : circumference * (1 - accuracyRate / 100);

    const pills = [
        { label: "AI-categorized", value: aiCategorized },
        { label: "accepted",        value: accepted },
        { label: "corrected",       value: corrected },
    ];

    const corrections = recentCorrections.slice(0, 3);

    return (
        <div style={S.card}>
            {/* Header */}
            <div style={S.header}>
                <div style={S.titleRow}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ marginRight: 7, flexShrink: 0 }}>
                        <path d="M8 1 L9.15 6.85 L15 8 L9.15 9.15 L8 15 L6.85 9.15 L1 8 L6.85 6.85 Z" fill="#2D6A4F"/>
                    </svg>
                    <h3 style={S.title}>AI Accuracy</h3>
                </div>
            </div>

            {/* Circular progress ring */}
            <div style={S.ringWrap}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#E5E7EB" strokeWidth={SW} />
                    <circle
                        cx={CX} cy={CY} r={R}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={SW}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(-90 ${CX} ${CY})`}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                </svg>
                <div style={S.ringCenter}>
                    {accuracyRate === null
                        ? <span style={S.ringNa}>—</span>
                        : <span style={{ ...S.ringPct, color: ringColor }}>{accuracyRate}%</span>
                    }
                </div>
            </div>

            {accuracyRate === null && (
                <p style={S.noData}>No data yet — add transactions to measure accuracy</p>
            )}

            {/* Stat pills */}
            <div style={S.pills}>
                {pills.map(p => (
                    <div key={p.label} style={S.pill}>
                        <span style={S.pillVal}>{p.value}</span>
                        <span style={S.pillLbl}>{p.label}</span>
                    </div>
                ))}
            </div>

            {/* Recent corrections */}
            {corrections.length > 0 && (
                <div style={S.corrSection}>
                    <p style={S.corrHeading}>Recent corrections</p>
                    {corrections.map((c, i) => (
                        <div key={i} style={{ ...S.corrRow, borderBottom: i < corrections.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                            <span style={S.corrDesc}>
                                {c.description.length > 24 ? c.description.slice(0, 24) + "…" : c.description}
                            </span>
                            <span style={S.corrArrow}>→</span>
                            <span style={S.corrCat}>{c.correctedCategory}</span>
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
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
    },
    shimmer: {
        background: "#E5E7EB",
        borderRadius: 8,
        height: 240,
        animation: "acShimmer 1.4s ease-in-out infinite",
    },
    header: {
        display: "flex",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 14,
        borderBottom: "1px solid #E5E7EB",
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
    },
    title: {
        margin: 0,
        fontSize: 15,
        fontWeight: 600,
        color: "#111111",
    },
    ringWrap: {
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "4px 0 16px",
    },
    ringCenter: {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    ringPct: {
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1,
    },
    ringNa: {
        fontSize: 22,
        fontWeight: 700,
        color: "#9CA3AF",
        lineHeight: 1,
    },
    noData: {
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        margin: "0 0 16px",
        lineHeight: 1.55,
    },
    pills: {
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginBottom: 20,
    },
    pill: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "6px 10px",
        minWidth: 72,
    },
    pillVal: {
        fontSize: 16,
        fontWeight: 700,
        color: "#111111",
        lineHeight: 1.2,
    },
    pillLbl: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
        textAlign: "center",
    },
    corrSection: {
        borderTop: "1px solid #E5E7EB",
        paddingTop: 14,
    },
    corrHeading: {
        margin: "0 0 8px",
        fontSize: 11,
        fontWeight: 600,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    corrRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 0",
    },
    corrDesc: {
        flex: 1,
        fontSize: 12,
        color: "#374151",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    },
    corrArrow: {
        fontSize: 12,
        color: "#9CA3AF",
        flexShrink: 0,
    },
    corrCat: {
        fontSize: 12,
        fontWeight: 600,
        color: "#2D6A4F",
        whiteSpace: "nowrap",
    },
};
