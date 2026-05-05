import { useState, useEffect, memo } from "react";
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { transactionService } from "../../api/transactionService";

const COLORS = ["#2D6A4F", "#A8D5A2", "#1A4731", "#4CAF50", "#80CBC4", "#66BB6A", "#D97706"];

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
        if (txProp) { setData(buildChartData(txProp)); return; }
        transactionService.getTransactions()
            .then((tx) => setData(buildChartData(tx)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [txProp]);

    if (loading) return <div style={S.placeholder}>Loading...</div>;
    if (data.length === 0) return <div style={S.placeholder}>No expenses yet</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                />
                <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: 8, border: "none", background: "#1A3C2E", fontSize: 12, color: "#fff" }}
                />
                <Legend
                    layout="vertical" verticalAlign="middle" align="right"
                    wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default memo(CategoryChart);

const S = {
    placeholder: { textAlign: "center", padding: "3rem", color: "#9CA3AF", fontSize: 13 },
};
