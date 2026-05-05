import { useState, useEffect, memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { transactionService } from "../../api/transactionService";

function buildChartData(transactions) {
    const now = new Date();
    const buckets = new Map();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets.set(key, {
            month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            income: 0,
            expenses: 0,
        });
    }

    for (const t of transactions) {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = buckets.get(key);
        if (!bucket) continue;
        if (t.type === "income") bucket.income   += t.amount;
        else                     bucket.expenses += t.amount;
    }

    return [...buckets.values()];
}

function MonthlyChart({ transactions: txProp }) {
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
    if (!data.some(d => d.income > 0 || d.expenses > 0)) {
        return <div style={S.placeholder}>No transaction data yet</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 8, border: "none", background: "#1A3C2E", fontSize: 12, color: "#fff" }}
                    cursor={{ fill: "rgba(45,106,79,0.06)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9CA3AF" }} />
                <Bar dataKey="income"   fill="#2D6A4F" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#A8D5A2" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default memo(MonthlyChart);

const S = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#9CA3AF", fontSize: 13 },
};
