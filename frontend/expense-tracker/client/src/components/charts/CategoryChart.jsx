import { useState, useEffect, memo } from "react";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { transactionService } from "../../api/transactionService";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#818cf8", "#34d399", "#fb923c"];

// Single pass over transactions — O(N)
function buildChartData(transactions) {
    const totals = new Map();
    for (const t of transactions) {
        if (t.type !== "expense") continue;
        totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return [...totals.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7)
        .map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }));
}

function CategoryChart({ transactions: txProp }) {
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
    if (data.length === 0) return <div style={styles.placeholder}>No expenses yet</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #334155", background: "#1e293b", fontSize: 13, color: "#f1f5f9" }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default memo(CategoryChart);

const styles = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#64748b", fontSize: 13 },
};
