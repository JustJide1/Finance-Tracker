import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "../hooks/useBudgets";
import PageLayout from "../components/PageLayout";
import { useToast } from "../components/Toast";
import { getStatusColor } from "../utils/statusColors";

export default function Budgets() {
    const [form, setForm] = useState({ category: "", amount: "", period: "monthly" });
    const [editingId, setEditingId] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    const { budgets, loading, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudgets();

    useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return toast.error("All fields are required");
        try {
            if (editingId) {
                await updateBudget(editingId, { amount: parseFloat(form.amount), period: form.period });
            } else {
                await createBudget({ category: form.category, amount: parseFloat(form.amount), period: form.period });
            }
            setForm({ category: "", amount: "", period: "monthly" });
            setEditingId(null);
        } catch (err) {
            // Handled by hook
        }
    };

    const handleEdit = (b) => {
        setEditingId(b._id);
        setForm({ category: b.category, amount: b.amount.toString(), period: b.period });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({ category: "", amount: "", period: "monthly" });
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this budget?")) return;
        try {
            await deleteBudget(id);
        } catch {
            // Handled by hook
        }
    };

    const categoryOptions = [
        "Food & Dining", "Transportation", "Shopping", "Entertainment",
        "Bills & Utilities", "Healthcare", "Education", "Investment",
        "Business", "Gifts", "Other",
    ];

    return (
        <PageLayout
            activeTab="budgets"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); }}
            title="Budgets"
            subtitle="Set spending limits to stay on track"
            contentStyle={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>{editingId ? "Edit Budget" : "Set New Budget"}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={!!editingId}>
                        <option value="">Select category</option>
                        {categoryOptions.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input style={styles.input} type="number" placeholder="Amount (₦)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    <select style={styles.input} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    <div style={styles.btnGroup}>
                        {editingId && <button type="button" style={styles.btnCancel} onClick={handleCancel}>Cancel</button>}
                        <button style={styles.btnPrimary} type="submit" disabled={loading}>
                            {loading ? "Saving..." : editingId ? "Update" : "Add Budget"}
                        </button>
                    </div>
                </form>
            </div>

            <div style={styles.card}>
                <h3 style={styles.cardTitle}>Your Budgets</h3>
                {budgets.length === 0 ? (
                    <p style={styles.empty}>No budgets yet. Create one to start tracking.</p>
                ) : (
                    <div style={styles.list}>
                        {budgets.map((b) => {
                            const c = getStatusColor(b.status);
                            return (
                                <div key={b._id} style={styles.budgetItem}>
                                    <div style={styles.budgetHeader}>
                                        <div>
                                            <div style={styles.budgetCategory}>{b.category}</div>
                                            <div style={styles.budgetPeriod}>{b.period}</div>
                                        </div>
                                        <div style={styles.actions}>
                                            <button style={styles.btnEdit} onClick={() => handleEdit(b)}>Edit</button>
                                            <button style={styles.btnDel} onClick={() => handleDelete(b._id)}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={styles.amountRow}>
                                        <span style={styles.spent}>₦{b.spent.toLocaleString()}</span>
                                        <span style={styles.budgetOf}>of ₦{b.amount.toLocaleString()}</span>
                                    </div>
                                    <div style={styles.progressBar}>
                                        <div style={{ ...styles.progressFill, width: `${Math.min(b.percentage, 100)}%`, background: c.bg }} />
                                    </div>
                                    <div style={styles.statusRow}>
                                        <span style={{ ...styles.statusBadge, background: c.light, color: c.text }}>
                                            {b.percentage.toFixed(0)}% used
                                        </span>
                                        <span style={styles.remaining}>
                                            {b.status === "exceeded"
                                                ? `₦${(b.spent - b.amount).toLocaleString()} over`
                                                : `₦${b.remaining.toLocaleString()} left`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}

const styles = {
    card: { background: "#1e293b", borderRadius: "clamp(12px, 2vw, 16px)", padding: "clamp(1rem, 3vw, 1.5rem)", border: "1px solid #334155", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: "1rem" },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "end" },
    input: { padding: "11px 14px", fontSize: 14, border: "1.5px solid #334155", borderRadius: 12, outline: "none", background: "#334155", color: "#f1f5f9", fontFamily: "inherit" },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnPrimary: { flex: 1, padding: "11px 14px", fontSize: 14, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel: { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    empty: { fontSize: 14, color: "#64748b", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.875rem" },
    budgetItem: { padding: "1rem", background: "#334155", borderRadius: 12, border: "1px solid #475569" },
    budgetHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" },
    budgetCategory: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
    budgetPeriod: { fontSize: 12, color: "#64748b", textTransform: "capitalize", marginTop: 2 },
    actions: { display: "flex", gap: "0.375rem" },
    btnEdit: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid #475569", color: "#94a3b8", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDel: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    amountRow: { display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" },
    spent: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
    budgetOf: { fontSize: 13, color: "#64748b" },
    progressBar: { width: "100%", height: 6, background: "#475569", borderRadius: 20, overflow: "hidden", marginBottom: "0.75rem" },
    progressFill: { height: "100%", borderRadius: 20, transition: "width 0.3s ease" },
    statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    statusBadge: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
    remaining: { fontSize: 12, color: "#64748b" },
};
