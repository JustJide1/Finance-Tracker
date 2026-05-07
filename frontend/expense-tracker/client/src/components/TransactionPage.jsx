import { useState, useEffect, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useAI } from "../hooks/useAI";
import TransactionFilters from "./TransactionFilters";
import { useToast } from "./Toast";

export default function TransactionPage({ type }) {
    const isExpense = type === "expense";

    const cfg = {
        addTitle: isExpense ? "Log New Expense" : "Add Income Entry",
        editTitle: isExpense ? "Edit Expense" : "Edit Income Entry",
        historyTitle: isExpense ? "Expense History" : "Income History",
        addBtn: isExpense ? "Add Expense" : "Add Income",
        amountColor: isExpense ? "#DC2626" : "#2D6A4F",
        submitBg: isExpense
            ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
            : "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        editingBorder: isExpense ? "#DC2626" : "#2D6A4F",
        editingBg: isExpense ? "rgba(220,38,38,0.05)" : "rgba(45,106,79,0.06)",
    };

    const [form, setForm] = useState({ amount: "", category: "", description: "", date: "" });
    const [editingId, setEditingId] = useState(null);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const toast = useToast();

    const { transactions: allTransactions, loading: loadingTx, fetchTransactions, createTransaction, updateTransaction, deleteTransaction, deleteAllExpenses, deleteAllIncome } = useTransactions(type);
    const { suggestCategory: aiSuggestCategory, loading: suggesting } = useAI();

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
    useEffect(() => { setFilteredTransactions(allTransactions); }, [allTransactions]);

    const uniqueCategories = useMemo(
        () => [...new Set(allTransactions.map(t => t.category))],
        [allTransactions]
    );

    const handleFilter = (filters) => {
        const term = filters.search ? filters.search.toLowerCase() : null;
        const startMs = filters.startDate ? new Date(filters.startDate).getTime() : null;
        const endMs = filters.endDate ? new Date(filters.endDate).getTime() : null;

        setFilteredTransactions(allTransactions.filter(t => {
            if (term && !t.description.toLowerCase().includes(term) && !t.category.toLowerCase().includes(term)) return false;
            if (filters.category && t.category !== filters.category) return false;
            if (startMs !== null && new Date(t.date).getTime() < startMs) return false;
            if (endMs !== null && new Date(t.date).getTime() > endMs) return false;
            return true;
        }));
    };

    const handleSuggestCategory = async () => {
        if (!form.description) return toast.error("Enter a description first");
        const category = await aiSuggestCategory(form.description);
        if (category) setForm(f => ({ ...f, category }));
    };

    const resetForm = () => { setForm({ amount: "", category: "", description: "", date: "" }); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.category || !form.description || !form.date) return toast.error("All fields are required");
        try {
            const payload = { type, amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date };
            if (editingId) await updateTransaction(editingId, payload);
            else await createTransaction(payload);
            resetForm();
        } catch {
            // handled by hook
        }
    };

    const handleEdit = (t) => {
        setEditingId(t._id);
        setForm({ amount: t.amount.toString(), category: t.category, description: t.description, date: new Date(t.date).toISOString().split("T")[0] });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!confirm(isExpense ? "Delete this expense?" : "Delete this income entry?")) return;
        try { await deleteTransaction(id); } catch { /* handled */ }
    };

    const handleClearAll = async () => {
        try {
            if (isExpense) await deleteAllExpenses(); else await deleteAllIncome();
            setShowClearDialog(false);
        } catch { setShowClearDialog(false); }
    };

    const itemStyle = (t) => ({
        ...S.item,
        ...(editingId === t._id ? { borderColor: cfg.editingBorder, background: cfg.editingBg } : {}),
    });

    return (
        <div style={S.wrapper}>
            {/* Confirmation dialog */}
            {showClearDialog && (
                <div style={S.overlay}>
                    <div style={S.dialog}>
                        <div style={S.dialogIcon}>🗑️</div>
                        <h4 style={S.dialogTitle}>Clear all {isExpense ? "expenses" : "income"}?</h4>
                        <p style={S.dialogMsg}>
                            Are you sure? <strong style={{ color: "#DC2626" }}>This cannot be undone.</strong>
                        </p>
                        <div style={S.dialogBtns}>
                            <button style={S.btnDialogCancel} onClick={() => setShowClearDialog(false)}>Cancel</button>
                            <button style={S.btnDialogDelete} onClick={handleClearAll}>Delete all</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <div style={S.card}>
                <h3 style={S.cardTitle}>{editingId ? cfg.editTitle : cfg.addTitle}</h3>
                <form onSubmit={handleSubmit} style={S.form}>
                    <input style={S.input} type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
                    <input style={S.input} type="text" placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} onBlur={() => { if (form.description && !form.category) handleSuggestCategory(); }} />
                    <div style={S.categoryWrapper}>
                        <input
                            style={{ ...S.input, paddingRight: 40 }}
                            type="text"
                            placeholder={suggesting ? "AI is categorising..." : "Category"}
                            value={form.category}
                            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                            readOnly={suggesting}
                        />
                        <button type="button" style={S.categoryBtn} onClick={handleSuggestCategory} disabled={suggesting} title="Re-suggest with AI">
                            {suggesting ? "..." : "AI"}
                        </button>
                    </div>
                    <input style={S.input} type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
                    <div style={{ ...S.btnGroup, gridColumn: "1 / -1" }}>
                        {editingId && <button type="button" style={S.btnCancel} onClick={resetForm}>Cancel</button>}
                        <button style={{ ...S.btnSubmit, background: cfg.submitBg }} type="submit" disabled={loadingTx}>
                            {loadingTx ? "Saving..." : editingId ? "Update" : cfg.addBtn}
                        </button>
                    </div>
                </form>
            </div>

            <TransactionFilters onFilter={handleFilter} categories={uniqueCategories} />

            {/* List */}
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ ...S.cardTitle, marginBottom: 0 }}>
                        {cfg.historyTitle}
                        {filteredTransactions.length !== allTransactions.length && (
                            <span style={S.countBadge}>{filteredTransactions.length} of {allTransactions.length}</span>
                        )}
                    </h3>
                    <button
                        style={{ ...S.btnClearAll, ...(allTransactions.length === 0 ? S.btnClearAllDisabled : {}) }}
                        onClick={() => allTransactions.length > 0 && setShowClearDialog(true)}
                        disabled={allTransactions.length === 0}
                    >
                        Clear all
                    </button>
                </div>
                {filteredTransactions.length === 0 ? (
                    <p style={S.empty}>
                        {allTransactions.length === 0 ? `No ${type} entries yet.` : "No matches found."}
                    </p>
                ) : (
                    <div style={S.list} className="thin-scroll">
                        {filteredTransactions.map((t) => (
                            <div key={t._id} style={itemStyle(t)}>
                                <div style={S.itemLeft}>
                                    <div style={S.itemCategory}>{t.category}</div>
                                    <div style={S.itemDesc}>{t.description}</div>
                                    <div style={S.itemDate}>{new Date(t.date).toLocaleDateString()}</div>
                                </div>
                                <div style={S.itemRight}>
                                    <div style={{ ...S.itemAmount, color: cfg.amountColor }}>
                                        ₦{t.amount.toLocaleString()}
                                    </div>
                                    <div style={S.itemActions}>
                                        <button style={S.btnEdit} onClick={() => handleEdit(t)}>Edit</button>
                                        <button style={S.btnDelete} onClick={() => handleDelete(t._id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const S = {
    wrapper: { display: "flex", flexDirection: "column", gap: "1.25rem" },
    card: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#111111", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 },
    countBadge: { fontSize: 12, fontWeight: 400, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 20 },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" },
    input: {
        padding: "11px 14px",
        fontSize: 14,
        border: "1.5px solid #E5E7EB",
        borderRadius: 12,
        outline: "none",
        background: "#F9FAFB",
        color: "#111111",
        fontFamily: "inherit",
        width: "100%",
        boxSizing: "border-box",
    },
    categoryWrapper: { position: "relative", display: "flex", alignItems: "center" },
    categoryBtn: {
        position: "absolute",
        right: 8,
        padding: "4px 8px",
        fontSize: 10,
        fontWeight: 700,
        background: "rgba(45,106,79,0.10)",
        color: "#2D6A4F",
        border: "1px solid rgba(45,106,79,0.2)",
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1.4,
    },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnSubmit: { padding: "11px 20px", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel: { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnClearAll: {
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        color: "#DC2626",
        border: "1.5px solid rgba(220,38,38,0.3)",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
    },
    btnClearAllDisabled: { opacity: 0.35, cursor: "not-allowed", color: "#9CA3AF", border: "1.5px solid #E5E7EB" },
    empty: { fontSize: 14, color: "#9CA3AF", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" },
    item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", transition: "all 0.2s" },
    itemLeft: { flex: 1 },
    itemCategory: { fontSize: 14, fontWeight: 600, color: "#111111" },
    itemDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },
    itemDate: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
    itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" },
    itemAmount: { fontSize: 15, fontWeight: 700 },
    itemActions: { display: "flex", gap: "0.375rem" },
    btnEdit: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid #E5E7EB", color: "#6B7280", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDelete: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid rgba(220,38,38,0.25)", color: "#DC2626", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    dialog: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: "2rem 2.25rem", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" },
    dialogIcon: { fontSize: 36, marginBottom: "0.75rem" },
    dialogTitle: { fontSize: 16, fontWeight: 700, color: "#111111", margin: "0 0 0.5rem" },
    dialogMsg: { fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 1.5rem" },
    dialogBtns: { display: "flex", gap: "0.75rem", justifyContent: "center" },
    btnDialogCancel: { padding: "10px 22px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" },
    btnDialogDelete: { padding: "10px 22px", fontSize: 14, fontWeight: 600, background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" },
};
