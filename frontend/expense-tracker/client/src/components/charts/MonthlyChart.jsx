import { useState, useEffect, memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { transactionService } from "../../api/transactionService";

// Build month buckets and group in a single pass — O(N) instead of O(N×6)
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
        if (t.type === "income")   bucket.income   += t.amount;
        else                       bucket.expenses += t.amount;
    }

    return [...buckets.values()];
}

function MonthlyChart({ transactions: txProp }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(!txProp);

    useEffect(() => {
        if (txProp) {
            setData(buildChartData(txProp));
            return;
        }
        // Standalone fallback (not used inside DashboardHome)
        transactionService.getTransactions()
            .then((tx) => setData(buildChartData(tx)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [txProp]);

    if (loading) return <div style={styles.placeholder}>Loading...</div>;
    if (!data.some(d => d.income > 0 || d.expenses > 0)) {
        return <div style={styles.placeholder}>No transaction data yet</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #334155", background: "#1e293b", fontSize: 13, color: "#f1f5f9" }}
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="income"   fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default memo(MonthlyChart);

const styles = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#64748b", fontSize: 13 },
};
