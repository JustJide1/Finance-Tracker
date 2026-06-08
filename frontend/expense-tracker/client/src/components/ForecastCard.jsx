import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import axios from "../api/axios";

function ForecastCard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/ai/forecast")
            .then(res => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={S.card}>
                <style>{`@keyframes fcShimmer{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                <div style={S.shimmer} />
            </div>
        );
    }

    const { forecastData = [], insight = "", months = [] } = data || {};

    if (!forecastData.length) {
        return (
            <div style={S.card}>
                <div style={S.header}>
                    <h3 style={S.title}>Spending Forecast</h3>
                    <p style={S.subtitle}>Predicted next month by category</p>
                </div>
                <p style={S.empty}>
                    Track expenses for 2+ months to unlock your spending forecast.
                </p>
            </div>
        );
    }

    const truncate = (str) => str.length > 10 ? str.slice(0, 10) + "…" : str;

    return (
        <div style={S.card}>
            <div style={S.header}>
                <h3 style={S.title}>Spending Forecast</h3>
                <p style={S.subtitle}>Predicted next month by category</p>
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={forecastData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="category"
                        tickFormatter={truncate}
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`}
                        width={48}
                    />
                    <Tooltip
                        formatter={(value) => `₦${Number(value).toLocaleString()}`}
                        contentStyle={{
                            background: "#1A3C2E",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "#fff",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 4 }}
                        itemStyle={{ color: "#90EE90" }}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Legend
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar dataKey="m3" name={months[0] || "Oldest month"}   fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="m2" name={months[1] || "Previous month"} fill="#94A3B8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="forecastAmount" name="Predicted (next month)" fill="rgba(45,106,79,0.85)" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            {insight && (
                <div style={S.insightBox}>💡 {insight}</div>
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
        height: 300,
        animation: "fcShimmer 1.4s ease-in-out infinite",
    },
    header: {
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
    subtitle: {
        margin: "3px 0 0",
        fontSize: 12,
        color: "#9CA3AF",
    },
    empty: {
        textAlign: "center",
        fontSize: 13,
        color: "#9CA3AF",
        padding: "32px 16px",
        lineHeight: 1.6,
        margin: 0,
    },
    insightBox: {
        marginTop: 16,
        background: "rgba(45,106,79,0.06)",
        border: "1px solid rgba(45,106,79,0.15)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        color: "#1A4731",
        fontStyle: "italic",
        lineHeight: 1.55,
    },
};

export default ForecastCard;
