import { useState, useEffect, memo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { transactionService } from "../../api/transactionService";

// Single pass — accumulates daily expense totals for the current month
function buildChartData(transactions) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Pre-allocate result array with zeros — avoids repeated array allocation
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
        if (txProp) {
            setData(buildChartData(txProp));
            return;
        }
        transactionService.getTransactions()
            .then((tx) => setData(buildChartData(tx)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [txProp]);

    if (loading) return <div style={styles.placeholder}>Loading...</div>;
    if (!data.some(d => d.amount > 0)) return <div style={styles.placeholder}>No expenses this month</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #334155", background: "#1e293b", fontSize: 13, color: "#f1f5f9" }}
                    cursor={{ stroke: "#334155" }}
                />
                <Line type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#818cf8", strokeWidth: 0 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default memo(TrendChart);

const styles = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#64748b", fontSize: 13 },
};
