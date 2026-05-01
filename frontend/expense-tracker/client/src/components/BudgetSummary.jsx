import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "../hooks/useBudgets";
import { getStatusColor } from "../utils/statusColors";

function BudgetSummary() {
    const { budgets: allBudgets, loading, fetchBudgets } = useBudgets();
    const navigate = useNavigate();

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const budgets = allBudgets.slice(0, 3);
    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3 style={styles.title}>Budget Overview</h3>
                <button style={styles.viewAll} onClick={() => navigate("/budgets")}>
                    Manage
                </button>
            </div>

            {loading ? (
                <p style={styles.empty}>Loading...</p>
            ) : budgets.length === 0 ? (
                <div style={styles.emptyState}>
                    <p style={styles.empty}>No budgets set yet</p>
                    <button style={styles.btnCreate} onClick={() => navigate("/budgets")}>
                        Create your first budget
                    </button>
                </div>
            ) : (
                <div style={styles.list}>
                    {budgets.map((b) => (
                        <div key={b._id} style={styles.item}>
                            <div style={styles.itemHeader}>
                                <span style={styles.category}>{b.category}</span>
                                <span style={{ ...styles.percent, color: getStatusColor(b.status).bg }}>
                                    {b.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <div style={styles.bar}>
                                <div style={{ ...styles.barFill, width: `${Math.min(b.percentage, 100)}%`, background: getStatusColor(b.status).bg }} />
                            </div>
                            <div style={styles.amounts}>
                                <span style={styles.spent}>₦{b.spent.toLocaleString()}</span>
                                <span style={styles.total}>/ ₦{b.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    card: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.25rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #334155",
    },
    title: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#f1f5f9", margin: 0 },
    viewAll: {
        fontSize: 13,
        fontWeight: 500,
        color: "#818cf8",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    empty: { fontSize: 13, color: "#64748b", textAlign: "center", margin: "1rem 0" },
    emptyState: { textAlign: "center", padding: "1rem 0" },
    btnCreate: {
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        background: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    list: { display: "flex", flexDirection: "column", gap: "0.875rem" },
    item: { padding: "0.875rem", background: "#334155", borderRadius: 10 },
    itemHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    category: { fontSize: 13, fontWeight: 600, color: "#f1f5f9" },
    percent: { fontSize: 13, fontWeight: 700 },
    bar: { width: "100%", height: 5, background: "#475569", borderRadius: 20, overflow: "hidden", marginBottom: 8 },
    barFill: { height: "100%", borderRadius: 20, transition: "width 0.3s ease" },
    amounts: { display: "flex", gap: 4, fontSize: 11 },
    spent: { color: "#94a3b8", fontWeight: 600 },
    total: { color: "#64748b" },
};

export default memo(BudgetSummary);
