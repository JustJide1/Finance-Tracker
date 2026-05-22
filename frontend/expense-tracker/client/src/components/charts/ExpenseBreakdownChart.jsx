import { useState, useEffect, memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { transactionService } from "../../api/transactionService";

// 8 slice colors: brand greens first, then complementary accent colors
const SLICE_COLORS = [
    "#2D6A4F",  // primary accent
    "#D97706",  // amber
    "#0EA5E9",  // sky blue
    "#8B5CF6",  // violet
    "#F97316",  // orange
    "#4CAF50",  // bright green
    "#EC4899",  // pink
    "#1A4731",  // dark green
];

const RADIAN = Math.PI / 180;

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.04) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x} y={y}
            fill="#fff"
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

function BreakdownTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, value, payload: p } = payload[0];
    return (
        <div style={S.tooltip}>
            <div style={S.tooltipTitle}>{name}</div>
            <div style={S.tooltipRow}>
                <span style={S.tooltipLabel}>Amount</span>
                <span style={S.tooltipValue}>₦{value.toLocaleString()}</span>
            </div>
            <div style={S.tooltipRow}>
                <span style={S.tooltipLabel}>Share</span>
                <span style={S.tooltipValue}>{p.percentage}%</span>
            </div>
        </div>
    );
}

function Legend({ data }) {
    return (
        <div style={S.legend}>
            {data.map((item, i) => (
                <div key={item.name} style={S.legendItem}>
                    <span style={{ ...S.legendDot, background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                    <span style={S.legendName} title={item.name}>{item.name}</span>
                    <span style={S.legendPct}>{item.percentage}%</span>
                </div>
            ))}
        </div>
    );
}

function Shimmer() {
    return (
        <div style={S.shimmerWrap}>
            <div style={S.shimmerCircle} />
            <div style={S.shimmerLines}>
                {[88, 72, 80, 60, 68, 52].map((w, i) => (
                    <div
                        key={i}
                        style={{ ...S.shimmerLine, width: `${w}%`, animationDelay: `${i * 0.12}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={S.empty}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <p style={S.emptyTitle}>No expenses yet</p>
            <p style={S.emptyHint}>Add expense transactions to see your spending breakdown by category.</p>
        </div>
    );
}

function buildFromTransactions(txns) {
    const totals = new Map();
    for (const t of txns) {
        if (t.type !== "expense") continue;
        totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const grandTotal = entries.reduce((s, [, v]) => s + v, 0);
    return entries.map(([name, value]) => ({
        name,
        value,
        percentage: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
    }));
}

function ExpenseBreakdownChart({ transactions: txProp }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (txProp) {
            setData(buildFromTransactions(txProp));
            setLoading(false);
            return;
        }
        transactionService.getCategoryBreakdown()
            .then((res) => setData(
                res.data.map((c) => ({ name: c.category, value: c.amount, percentage: c.percentage }))
            ))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [txProp]);

    if (loading) return <Shimmer />;
    if (data.length === 0) return <EmptyState />;

    return (
        <div style={S.wrap}>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        dataKey="value"
                        label={renderLabel}
                        labelLine={false}
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<BreakdownTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <Legend data={data} />
        </div>
    );
}

export default memo(ExpenseBreakdownChart);

const S = {
    wrap: { display: "flex", flexDirection: "column", gap: 10 },

    tooltip: {
        background: "#1A3C2E",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        color: "#fff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        minWidth: 160,
        pointerEvents: "none",
    },
    tooltipTitle: { fontWeight: 700, marginBottom: 6, color: "#A8D5A2", fontSize: 12 },
    tooltipRow: { display: "flex", justifyContent: "space-between", gap: 16, lineHeight: 1.7 },
    tooltipLabel: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
    tooltipValue: { fontWeight: 600, color: "#fff" },

    legend: { display: "flex", flexWrap: "wrap", gap: "5px 14px", padding: "0 2px" },
    legendItem: { display: "flex", alignItems: "center", gap: 5, minWidth: 0 },
    legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
    legendName: {
        fontSize: 11, color: "#6B7280",
        maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        flex: 1, minWidth: 0,
    },
    legendPct: { fontSize: 11, fontWeight: 700, color: "#374151", flexShrink: 0 },

    empty: {
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "28px 16px", textAlign: "center",
    },
    emptyTitle: { fontSize: 13, fontWeight: 600, color: "#6B7280", margin: 0 },
    emptyHint: { fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.5, maxWidth: 220 },

    shimmerWrap: { display: "flex", gap: 16, padding: "12px 0", alignItems: "center" },
    shimmerCircle: {
        width: 110, height: 110, borderRadius: "50%",
        background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        flexShrink: 0,
    },
    shimmerLines: { flex: 1, display: "flex", flexDirection: "column", gap: 9 },
    shimmerLine: {
        height: 11, borderRadius: 4,
        background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
    },
};
