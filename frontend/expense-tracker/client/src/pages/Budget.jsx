import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "../hooks/useBudgets";
import PageLayout from "../components/PageLayout";
import { useToast } from "../components/Toast";
import { getStatusColor } from "../utils/statusColors";
import CATEGORIES from "../constants/categories";

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
            if (editingId) await updateBudget(editingId, { amount: parseFloat(form.amount), period: form.period });
            else           await createBudget({ category: form.category, amount: parseFloat(form.amount), period: form.period });
            setForm({ category: "", amount: "", period: "monthly" });
            setEditingId(null);
        } catch { /* handled by hook */ }
    };

    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const handleEdit = (b) => { setEditingId(b._id); setForm({ category: b.category, amount: b.amount.toString(), period: b.period }); };
    const handleCancel = () => { setEditingId(null); setForm({ category: "", amount: "", period: "monthly" }); };
    const handleDelete = (id) => setPendingDeleteId(id);

    const confirmDelete = async () => {
        const id = pendingDeleteId;
        setPendingDeleteId(null);
        try { await deleteBudget(id); } catch { /* handled */ }
    };

    return (
        <>
        {pendingDeleteId && (
            <div style={S.overlay}>
                <div role="dialog" aria-modal="true" aria-labelledby="del-bud-title" style={S.dialog}>
                    <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>🗑️</div>
                    <h4 id="del-bud-title" style={S.dialogTitle}>Delete budget?</h4>
                    <p style={S.dialogMsg}>This budget and its tracking data will be removed. <strong style={{ color: "#DC2626" }}>This cannot be undone.</strong></p>
                    <div style={S.dialogBtns}>
                        <button style={S.btnDialogCancel} onClick={() => setPendingDeleteId(null)}>Cancel</button>
                        <button style={S.btnDialogDelete} onClick={confirmDelete}>Delete</button>
                    </div>
                </div>
            </div>
        )}
        <PageLayout
            activeTab="budgets"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); if (tab === "recurring") navigate("/recurring"); }}
            title="Budgets"
            subtitle="Track your spending limits"
            contentStyle={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={S.card}>
                <h3 style={S.cardTitle}>{editingId ? "Edit Budget" : "Add Budget"}</h3>
                <form style={S.form} onSubmit={handleSubmit}>
                    <select style={S.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={!!editingId}>
                        <option value="">Select category</option>
                        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input style={S.input} type="number" placeholder="Amount (₦)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    <select style={S.input} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    <div style={S.btnGroup}>
                        {editingId && <button type="button" style={S.btnCancel} onClick={handleCancel}>Cancel</button>}
                        <button style={S.btnPrimary} type="submit" disabled={loading}>
                            {loading ? "Saving..." : editingId ? "Update" : "Add Budget"}
                        </button>
                    </div>
                </form>
            </div>

            <div style={S.card}>
                <h3 style={S.cardTitle}>Your Budgets</h3>
                {budgets.length === 0 ? (
                    <p style={S.empty}>No budgets yet. Create one to start tracking.</p>
                ) : (
                    <div style={S.list}>
                        {budgets.map((b) => {
                            const c = getStatusColor(b.status);
                            return (
                                <div key={b._id} style={S.budgetItem}>
                                    <div style={S.budgetHeader}>
                                        <div>
                                            <div style={S.budgetCategory}>{b.category}</div>
                                            <div style={S.budgetPeriod}>{b.period}</div>
                                        </div>
                                        <div style={S.actions}>
                                            <button style={S.btnEdit} onClick={() => handleEdit(b)}>Edit</button>
                                            <button style={S.btnDel}  onClick={() => handleDelete(b._id)}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={S.amountRow}>
                                        <span style={S.spent}>₦{b.spent.toLocaleString()}</span>
                                        <span style={S.budgetOf}>of ₦{b.amount.toLocaleString()}</span>
                                    </div>
                                    <div style={S.progressBar}>
                                        <div style={{ ...S.progressFill, width: `${Math.min(b.percentage, 100)}%`, background: c.bg }} />
                                    </div>
                                    <div style={S.statusRow}>
                                        <span style={{ ...S.statusBadge, background: c.light, color: c.text }}>
                                            {b.percentage.toFixed(0)}% used
                                        </span>
                                        <span style={S.remaining}>
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
        </>
    );
}

const S = {
    card: { background: "#FFFFFF", borderRadius: "clamp(12px, 2vw, 16px)", padding: "clamp(1rem, 3vw, 1.5rem)", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#111111", marginBottom: "1rem" },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "end" },
    input: { padding: "11px 14px", fontSize: 14, border: "1.5px solid #E5E7EB", borderRadius: 12, outline: "none", background: "#F9FAFB", color: "#111111", fontFamily: "inherit" },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnPrimary: { flex: 1, padding: "11px 14px", fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel:  { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    empty: { fontSize: 14, color: "#9CA3AF", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.875rem" },
    budgetItem: { padding: "1rem", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" },
    budgetHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" },
    budgetCategory: { fontSize: 14, fontWeight: 600, color: "#111111" },
    budgetPeriod:   { fontSize: 12, color: "#9CA3AF", textTransform: "capitalize", marginTop: 2 },
    actions: { display: "flex", gap: "0.375rem" },
    btnEdit: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid #E5E7EB",               color: "#6B7280", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDel:  { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid rgba(220,38,38,0.25)", color: "#DC2626", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    amountRow: { display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" },
    spent: { fontSize: 18, fontWeight: 700, color: "#111111" },
    budgetOf: { fontSize: 13, color: "#9CA3AF" },
    progressBar: { width: "100%", height: 6, background: "#E5E7EB", borderRadius: 20, overflow: "hidden", marginBottom: "0.75rem" },
    progressFill: { height: "100%", borderRadius: 20, transition: "width 0.3s ease" },
    statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    statusBadge: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
    remaining: { fontSize: 12, color: "#9CA3AF" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    dialog: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: "2rem 2.25rem", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" },
    dialogTitle: { fontSize: 16, fontWeight: 700, color: "#111111", margin: "0 0 0.5rem" },
    dialogMsg: { fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 1.5rem" },
    dialogBtns: { display: "flex", gap: "0.75rem", justifyContent: "center" },
    btnDialogCancel: { padding: "10px 22px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" },
    btnDialogDelete: { padding: "10px 22px", fontSize: 14, fontWeight: 600, background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" },
};
