import { useState, useEffect, memo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { transactionService } from "../../api/transactionService";

function buildChartData(transactions) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));

    for (const t of transactions) {
        if (t.type !== "expense") continue;
        const d = new Date(t.date);
        if (d.getFullYear() !== year || d.getMonth() !== month) continue;
        daily[d.getDate() - 1].amount += t.amount;
    }

    return daily;
}

function TrendChart({ transactions: txProp }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(!txProp);

    useEffect(() => {
        if (txProp) { setData(buildChartData(txProp)); return; }
        transactionService.getTransactions()
            .then((tx) => setData(buildChartData(tx)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [txProp]);

    if (loading) return <div style={S.placeholder}>Loading...</div>;
    if (!data.some(d => d.amount > 0)) return <div style={S.placeholder}>No expenses this month</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: 8, border: "none", background: "#1A3C2E", fontSize: 12, color: "#fff" }}
                    cursor={{ stroke: "#E5E7EB" }}
                />
                <Line
                    type="monotone" dataKey="amount"
                    stroke="#2D6A4F" strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#2D6A4F", strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default memo(TrendChart);

const S = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#9CA3AF", fontSize: 13 },
};
