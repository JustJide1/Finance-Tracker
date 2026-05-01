import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecurring } from "../hooks/useRecurring";
import PageLayout from "../components/PageLayout";
import { useToast } from "../components/Toast";

export default function Recurring() {
    const [form, setForm] = useState({
        type: "expense", amount: "", category: "", description: "",
        frequency: "monthly", startDate: new Date().toISOString().split("T")[0], endDate: "",
    });
    const [editingId, setEditingId] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    const { recurring, loading, fetchRecurring, createRecurring, updateRecurring, toggleRecurring, deleteRecurring } = useRecurring();

    useEffect(() => { fetchRecurring(); }, [fetchRecurring]);

    const resetForm = () => {
        setForm({ type: "expense", amount: "", category: "", description: "", frequency: "monthly", startDate: new Date().toISOString().split("T")[0], endDate: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.category || !form.description || !form.startDate) {
            return toast.error("Please fill in all required fields");
        }
        try {
            const payload = { ...form, amount: parseFloat(form.amount), endDate: form.endDate || null };
            if (editingId) {
                await updateRecurring(editingId, payload);
            } else {
                await createRecurring(payload);
            }
            resetForm();
        } catch (err) {
            // Handled by hook
        }
    };

    const handleEdit = (rec) => {
        setEditingId(rec._id);
        setForm({
            type: rec.type, amount: rec.amount.toString(), category: rec.category,
            description: rec.description, frequency: rec.frequency,
            startDate: new Date(rec.startDate).toISOString().split("T")[0],
            endDate: rec.endDate ? new Date(rec.endDate).toISOString().split("T")[0] : "",
        });
    };

    const handleToggle = async (id) => {
        try {
            await toggleRecurring(id);
        } catch {
            // Handled by hook
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this recurring rule?")) return;
        try {
            await deleteRecurring(id);
        } catch {
            // Handled by hook
        }
    };

    const categoryOptions = [
        "Food & Dining", "Transportation", "Shopping", "Entertainment",
        "Bills & Utilities", "Healthcare", "Education", "Investment",
        "Salary", "Business", "Gifts", "Other",
    ];

    const fields = [
        { label: "Type",               field: "type",        type: "select", options: [{ v: "expense", l: "Expense" }, { v: "income", l: "Income" }] },
        { label: "Amount (₦)",         field: "amount",      type: "number", placeholder: "0.00" },
        { label: "Category",           field: "category",    type: "select", options: categoryOptions.map(c => ({ v: c, l: c })), placeholder: "Select category" },
        { label: "Description",        field: "description", type: "text",   placeholder: "e.g., Netflix subscription" },
        { label: "Frequency",          field: "frequency",   type: "select", options: [{ v: "daily", l: "Daily" }, { v: "weekly", l: "Weekly" }, { v: "monthly", l: "Monthly" }] },
        { label: "Start Date",         field: "startDate",   type: "date" },
        { label: "End Date (optional)", field: "endDate",    type: "date" },
    ];

    return (
        <PageLayout
            activeTab="recurring"
            onNavClick={(tab) => {
                if (tab === "dashboard") navigate("/dashboard");
                if (tab === "budgets")   navigate("/budgets");
            }}
            title="Recurring"
            subtitle="Auto-track bills, salary, and subscriptions"
            contentStyle={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>{editingId ? "Edit Recurring Rule" : "Set Up Recurring Transaction"}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {fields.map(({ label, field, type, options, placeholder }) => (
                        <div key={field} style={styles.field}>
                            <label style={styles.label}>{label}</label>
                            {type === "select" ? (
                                <select style={styles.input} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}>
                                    {placeholder && <option value="">{placeholder}</option>}
                                    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                            ) : (
                                <input style={styles.input} type={type} placeholder={placeholder} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                            )}
                        </div>
                    ))}
                    <div style={{ ...styles.field, alignSelf: "end" }}>
                        <div style={styles.btnGroup}>
                            {editingId && <button type="button" style={styles.btnCancel} onClick={resetForm}>Cancel</button>}
                            <button style={styles.btnPrimary} type="submit" disabled={loading}>
                                {loading ? "Saving..." : editingId ? "Update" : "Create Rule"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div style={styles.card}>
                <h3 style={styles.cardTitle}>Active Rules</h3>
                {recurring.length === 0 ? (
                    <p style={styles.empty}>No recurring rules yet.</p>
                ) : (
                    <div style={styles.list}>
                        {recurring.map((rec) => (
                            <div key={rec._id} style={{ ...styles.item, opacity: rec.isActive ? 1 : 0.5 }}>
                                <div style={styles.itemLeft}>
                                    <div style={styles.itemTopRow}>
                                        <span style={styles.itemDesc}>{rec.description}</span>
                                        <span style={{ ...styles.typeBadge, ...(rec.type === "income" ? styles.incomeBadge : styles.expenseBadge) }}>
                                            {rec.type}
                                        </span>
                                    </div>
                                    <div style={styles.itemMeta}>
                                        {rec.category} · {rec.frequency} · Next: {new Date(rec.nextRun).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={styles.itemRight}>
                                    <div style={{ ...styles.itemAmount, color: rec.type === "income" ? "#10b981" : "#f43f5e" }}>
                                        ₦{rec.amount.toLocaleString()}
                                    </div>
                                    <div style={styles.itemActions}>
                                        <button style={{ ...styles.btnToggle, ...(rec.isActive ? styles.btnPause : styles.btnResume) }} onClick={() => handleToggle(rec._id)}>
                                            {rec.isActive ? "Pause" : "Resume"}
                                        </button>
                                        <button style={styles.btnEdit} onClick={() => handleEdit(rec)}>Edit</button>
                                        <button style={styles.btnDel}  onClick={() => handleDelete(rec._id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}

const styles = {
    card: { background: "#1e293b", borderRadius: "clamp(12px, 2vw, 16px)", padding: "clamp(1rem, 3vw, 1.5rem)", border: "1px solid #334155", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: "1.25rem" },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" },
    field: { display: "flex", flexDirection: "column" },
    label: { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
    input: { padding: "11px 14px", fontSize: 14, border: "1.5px solid #334155", borderRadius: 12, outline: "none", background: "#334155", color: "#f1f5f9", fontFamily: "inherit" },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnPrimary: { flex: 1, padding: "11px 14px", fontSize: 14, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel: { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    empty: { fontSize: 14, color: "#64748b", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.625rem" },
    item: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.875rem 1rem", background: "#334155", borderRadius: 12, gap: "1rem", flexWrap: "wrap" },
    itemLeft: { flex: 1, minWidth: 0 },
    itemTopRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 6, flexWrap: "wrap" },
    itemDesc: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
    typeBadge: { fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" },
    incomeBadge:  { background: "rgba(16,185,129,0.15)",  color: "#10b981" },
    expenseBadge: { background: "rgba(244,63,94,0.15)", color: "#f43f5e" },
    itemMeta: { fontSize: 12, color: "#64748b" },
    itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" },
    itemAmount: { fontSize: 15, fontWeight: 700 },
    itemActions: { display: "flex", gap: "0.375rem", flexWrap: "wrap" },
    btnToggle: { fontSize: 11, padding: "4px 10px", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" },
    btnPause:  { background: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
    btnResume: { background: "rgba(16,185,129,0.15)", color: "#10b981" },
    btnEdit: { fontSize: 11, padding: "4px 10px", background: "transparent", border: "1px solid #475569", color: "#94a3b8", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDel:  { fontSize: 11, padding: "4px 10px", background: "transparent", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
};
