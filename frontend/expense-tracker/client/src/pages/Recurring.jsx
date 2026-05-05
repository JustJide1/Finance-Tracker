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
        if (!form.amount || !form.category || !form.description || !form.startDate) return toast.error("Please fill in all required fields");
        try {
            const payload = { ...form, amount: parseFloat(form.amount), endDate: form.endDate || null };
            if (editingId) await updateRecurring(editingId, payload);
            else           await createRecurring(payload);
            resetForm();
        } catch { /* handled by hook */ }
    };

    const handleEdit = (rec) => {
        setEditingId(rec._id);
        setForm({
            type: rec.type, amount: rec.amount.toString(), category: rec.category,
            description: rec.description, frequency: rec.frequency,
            startDate: rec.startDate ? rec.startDate.slice(0, 10) : new Date().toISOString().split("T")[0],
            endDate:   rec.endDate   ? rec.endDate.slice(0, 10)   : "",
        });
    };

    const handleToggle = async (id) => { try { await toggleRecurring(id); } catch { /* handled */ } };
    const handleDelete = async (id) => {
        if (!confirm("Delete this recurring rule?")) return;
        try { await deleteRecurring(id); } catch { /* handled */ }
    };

    const categoryOptions = [
        "Food & Dining", "Transportation", "Shopping", "Entertainment",
        "Bills & Utilities", "Healthcare", "Education", "Investment",
        "Salary", "Business", "Gifts", "Other",
    ];

    const fields = [
        { label: "Type",                field: "type",        type: "select", options: [{ v: "expense", l: "Expense" }, { v: "income", l: "Income" }] },
        { label: "Amount (₦)",          field: "amount",      type: "number", placeholder: "0.00" },
        { label: "Category",            field: "category",    type: "select", options: categoryOptions.map(c => ({ v: c, l: c })), placeholder: "Select category" },
        { label: "Description",         field: "description", type: "text",   placeholder: "e.g., Netflix subscription" },
        { label: "Frequency",           field: "frequency",   type: "select", options: [{ v: "daily", l: "Daily" }, { v: "weekly", l: "Weekly" }, { v: "monthly", l: "Monthly" }] },
        { label: "Start Date",          field: "startDate",   type: "date" },
        { label: "End Date (optional)", field: "endDate",     type: "date" },
    ];

    return (
        <PageLayout
            activeTab="recurring"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); if (tab === "budgets") navigate("/budgets"); }}
            title="Schedule"
            subtitle="Auto-track bills, salary, and subscriptions"
            contentStyle={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={S.card}>
                <h3 style={S.cardTitle}>{editingId ? "Edit Recurring Rule" : "Set Up Recurring Transaction"}</h3>
                <form onSubmit={handleSubmit} style={S.form}>
                    {fields.map(({ label, field, type, options, placeholder }) => (
                        <div key={field} style={S.field}>
                            <label style={S.label}>{label}</label>
                            {type === "select" ? (
                                <select style={S.input} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}>
                                    {placeholder && <option value="">{placeholder}</option>}
                                    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                            ) : (
                                <input style={S.input} type={type} placeholder={placeholder} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                            )}
                        </div>
                    ))}
                    <div style={{ ...S.field, alignSelf: "end" }}>
                        <div style={S.btnGroup}>
                            {editingId && <button type="button" style={S.btnCancel} onClick={resetForm}>Cancel</button>}
                            <button style={S.btnPrimary} type="submit" disabled={loading}>
                                {loading ? "Saving..." : editingId ? "Update" : "Create Rule"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div style={S.card}>
                <h3 style={S.cardTitle}>Active Rules</h3>
                {recurring.length === 0 ? (
                    <p style={S.empty}>No recurring rules yet.</p>
                ) : (
                    <div style={S.list}>
                        {recurring.map((rec) => (
                            <div key={rec._id} style={{ ...S.item, opacity: rec.isActive ? 1 : 0.55 }}>
                                <div style={S.itemLeft}>
                                    <div style={S.itemTopRow}>
                                        <span style={S.itemDesc}>{rec.description}</span>
                                        <span style={{ ...S.typeBadge, ...(rec.type === "income" ? S.incomeBadge : S.expenseBadge) }}>
                                            {rec.type}
                                        </span>
                                    </div>
                                    <div style={S.itemMeta}>
                                        {rec.category} · {rec.frequency} · Next: {new Date(rec.nextRun).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={S.itemRight}>
                                    <div style={{ ...S.itemAmount, color: rec.type === "income" ? "#2D6A4F" : "#DC2626" }}>
                                        ₦{rec.amount.toLocaleString()}
                                    </div>
                                    <div style={S.itemActions}>
                                        <button style={{ ...S.btnToggle, ...(rec.isActive ? S.btnPause : S.btnResume) }} onClick={() => handleToggle(rec._id)}>
                                            {rec.isActive ? "Pause" : "Resume"}
                                        </button>
                                        <button style={S.btnEdit} onClick={() => handleEdit(rec)}>Edit</button>
                                        <button style={S.btnDel}  onClick={() => handleDelete(rec._id)}>Delete</button>
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

const S = {
    card: { background: "#FFFFFF", borderRadius: "clamp(12px, 2vw, 16px)", padding: "clamp(1rem, 3vw, 1.5rem)", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#111111", marginBottom: "1.25rem" },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" },
    field: { display: "flex", flexDirection: "column" },
    label: { fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
    input: { padding: "11px 14px", fontSize: 14, border: "1.5px solid #E5E7EB", borderRadius: 12, outline: "none", background: "#F9FAFB", color: "#111111", fontFamily: "inherit" },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnPrimary: { flex: 1, padding: "11px 14px", fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel:  { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    empty: { fontSize: 14, color: "#9CA3AF", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.625rem" },
    item: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.875rem 1rem", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", gap: "1rem", flexWrap: "wrap" },
    itemLeft: { flex: 1, minWidth: 0 },
    itemTopRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 6, flexWrap: "wrap" },
    itemDesc: { fontSize: 14, fontWeight: 600, color: "#111111" },
    typeBadge: { fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" },
    incomeBadge:  { background: "rgba(45,106,79,0.10)",   color: "#2D6A4F" },
    expenseBadge: { background: "rgba(220,38,38,0.08)",   color: "#DC2626" },
    itemMeta: { fontSize: 12, color: "#9CA3AF" },
    itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" },
    itemAmount: { fontSize: 15, fontWeight: 700 },
    itemActions: { display: "flex", gap: "0.375rem", flexWrap: "wrap" },
    btnToggle: { fontSize: 11, padding: "4px 10px", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 500, fontFamily: "inherit" },
    btnPause:  { background: "rgba(217,119,6,0.10)",  color: "#D97706" },
    btnResume: { background: "rgba(45,106,79,0.10)",  color: "#2D6A4F" },
    btnEdit: { fontSize: 11, padding: "4px 10px", background: "transparent", border: "1px solid #E5E7EB",               color: "#6B7280", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDel:  { fontSize: 11, padding: "4px 10px", background: "transparent", border: "1px solid rgba(220,38,38,0.25)", color: "#DC2626", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
};
