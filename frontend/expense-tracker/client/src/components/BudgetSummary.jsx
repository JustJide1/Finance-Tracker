import { useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "../hooks/useBudgets";
import { getStatusColor } from "../utils/statusColors";

function BudgetSummary() {
    const { budgets: allBudgets, loading, fetchBudgets } = useBudgets();
    const navigate = useNavigate();

    useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

    const budgets = allBudgets.slice(0, 3);

    return (
        <div style={S.card}>
            <div style={S.header}>
                <h3 style={S.title}>Budget Overview</h3>
                <button style={S.viewAll} onClick={() => navigate("/budgets")}>Manage</button>
            </div>

            {loading ? (
                <p style={S.empty}>Loading...</p>
            ) : budgets.length === 0 ? (
                <div style={S.emptyState}>
                    <p style={S.empty}>No budgets set yet</p>
                    <button style={S.btnCreate} onClick={() => navigate("/budgets")}>
                        Create your first budget
                    </button>
                </div>
            ) : (
                <div style={S.list}>
                    {budgets.map((b) => (
                        <div key={b._id} style={S.item}>
                            <div style={S.itemHeader}>
                                <span style={S.category}>{b.category}</span>
                                <span style={{ ...S.percent, color: getStatusColor(b.status).text }}>
                                    {b.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <div style={S.bar}>
                                <div style={{ ...S.barFill, width: `${Math.min(b.percentage, 100)}%`, background: getStatusColor(b.status).bg }} />
                            </div>
                            <div style={S.amounts}>
                                <span style={S.spent}>₦{b.spent.toLocaleString()}</span>
                                <span style={S.total}>/ ₦{b.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const S = {
    card: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.25rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #E5E7EB",
    },
    title: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#111111", margin: 0 },
    viewAll: {
        fontSize: 13,
        fontWeight: 500,
        color: "#2D6A4F",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    empty: { fontSize: 13, color: "#9CA3AF", textAlign: "center", margin: "1rem 0" },
    emptyState: { textAlign: "center", padding: "1rem 0" },
    btnCreate: {
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    list: { display: "flex", flexDirection: "column", gap: "0.875rem" },
    item: { padding: "0.875rem", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" },
    itemHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    category: { fontSize: 13, fontWeight: 600, color: "#111111" },
    percent: { fontSize: 13, fontWeight: 700 },
    bar: { width: "100%", height: 5, background: "#E5E7EB", borderRadius: 20, overflow: "hidden", marginBottom: 8 },
    barFill: { height: "100%", borderRadius: 20, transition: "width 0.3s ease" },
    amounts: { display: "flex", gap: 4, fontSize: 11 },
    spent: { color: "#374151", fontWeight: 600 },
    total: { color: "#9CA3AF" },
};

export default memo(BudgetSummary);
