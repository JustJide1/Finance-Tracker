import { useId } from "react";
import {
    Line,
    XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
    Area, ComposedChart
} from "recharts";

function DarkTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    // Deduplicate by dataKey (Area + Line both emit for "actual")
    // and suppress the bridge point's predicted entry (isBridge flag from backend)
    const seen = new Set();
    const entries = payload.filter(p => {
        if (p.value == null) return false;
        if (seen.has(p.dataKey)) return false;
        seen.add(p.dataKey);
        if (p.name === "Predicted" && p.payload?.isBridge) return false;
        return true;
    });

    if (!entries.length) return null;

    return (
        <div style={{
            background: "#1A3C2E",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#fff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            pointerEvents: "none",
        }}>
            {label && <div style={{ opacity: 0.65, marginBottom: 4, fontSize: 11 }}>{label}</div>}
            {entries.map((p) => {
                const isPredicted = p.name === "Predicted";
                return (
                    <div key={p.name ?? p.dataKey} style={{ color: isPredicted ? "#FCD34D" : "#90EE90", lineHeight: 1.6 }}>
                        {p.name}: ₦{Number(p.value).toLocaleString()}
                    </div>
                );
            })}
        </div>
    );
}

export default function ForecastChart({ data, loading }) {
    const uid = useId().replace(/:/g, "");
    const gradId = `forecastGrad-${uid}`;

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0", height: 180, justifyContent: 'center' }}>
                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "100%", animation: "shimmer 1.5s infinite" }} />
                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "80%", animation: "shimmer 1.5s infinite" }} />
                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "90%", animation: "shimmer 1.5s infinite" }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 40 }}>
                Not enough historical data for a forecast yet.
            </p>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                    axisLine={false} tickLine={false} width={44}
                />
                <Tooltip content={<DarkTooltip />} />
                
                {/* Area for past actuals */}
                <Area type="monotone" dataKey="actual" fill={`url(#${gradId})`} stroke="none" />
                
                {/* Solid line for actuals */}
                <Line type="monotone" dataKey="actual" stroke="#2D6A4F" strokeWidth={2.5} dot={{ r: 3, fill: "#2D6A4F", strokeWidth: 0 }} name="Actual" connectNulls />
                
                {/* Dashed line for predicted */}
                <Line type="monotone" dataKey="predicted" stroke="#D97706" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: "#D97706", strokeWidth: 0 }} name="Predicted" connectNulls />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
