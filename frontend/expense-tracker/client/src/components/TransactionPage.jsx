import { useState, useEffect, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useAI } from "../hooks/useAI";
import TransactionFilters from "./TransactionFilters";
import { useToast } from "./Toast";

/**
 * Single component for both expense and income CRUD.
 * Pass type="expense" or type="income".
 */
export default function TransactionPage({ type }) {
    const isExpense = type === "expense";

    const cfg = {
        addTitle:      isExpense ? "Log New Expense"    : "Add Income Entry",
        editTitle:     isExpense ? "Edit Expense"        : "Edit Income Entry",
        historyTitle:  isExpense ? "Expense History"     : "Income History",
        addBtn:        isExpense ? "Add Expense"         : "Add Income",
        amountColor:   isExpense ? "#f43f5e"             : "#10b981",
        submitBg:      isExpense ? "#6366f1"             : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        editingBorder: isExpense ? "#6366f1"             : "#10b981",
        editingBg:     isExpense ? "rgba(99,102,241,0.08)" : "rgba(16,185,129,0.06)",
    };

    const [form, setForm] = useState({ amount: "", category: "", description: "", date: "" });
    const [editingId, setEditingId] = useState(null);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const toast = useToast();

    const { transactions: allTransactions, loading: loadingTx, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions(type);
    const { suggestCategory: aiSuggestCategory, loading: suggesting } = useAI();

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    useEffect(() => {
        setFilteredTransactions(allTransactions);
    }, [allTransactions]);

    // Recomputed only when allTransactions changes — not on every render
    const uniqueCategories = useMemo(
        () => [...new Set(allTransactions.map(t => t.category))],
        [allTransactions]
    );

    const handleFilter = (filters) => {
        const term    = filters.search ? filters.search.toLowerCase() : null;
        const startMs = filters.startDate ? new Date(filters.startDate).getTime() : null;
        const endMs   = filters.endDate   ? new Date(filters.endDate).getTime()   : null;

        setFilteredTransactions(allTransactions.filter(t => {
            if (term && !t.description.toLowerCase().includes(term) && !t.category.toLowerCase().includes(term)) return false;
            if (filters.category && t.category !== filters.category) return false;
            if (startMs !== null && new Date(t.date).getTime() < startMs) return false;
            if (endMs   !== null && new Date(t.date).getTime() > endMs)   return false;
            return true;
        }));
    };

    const handleSuggestCategory = async () => {
        if (!form.description) return toast.error("Enter a description first");
        const category = await aiSuggestCategory(form.description);
        if (category) setForm(f => ({ ...f, category }));
    };

    const resetForm = () => {
        setForm({ amount: "", category: "", description: "", date: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.category || !form.description || !form.date) {
            return toast.error("All fields are required");
        }
        try {
            const payload = { type, amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date };
            if (editingId) {
                await updateTransaction(editingId, payload);
            } else {
                await createTransaction(payload);
            }
            resetForm();
        } catch (err) {
            // error already handled by hook
        }
    };

    const handleEdit = (t) => {
        setEditingId(t._id);
        setForm({
            amount: t.amount.toString(),
            category: t.category,
            description: t.description,
            date: new Date(t.date).toISOString().split("T")[0],
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!confirm(isExpense ? "Delete this expense?" : "Delete this income entry?")) return;
        try {
            await deleteTransaction(id);
        } catch (err) {
            // error handled by hook
        }
    };

    const itemStyle = (t) => ({
        ...styles.item,
        ...(editingId === t._id ? { borderColor: cfg.editingBorder, background: cfg.editingBg } : {}),
    });

    return (
        <div style={styles.wrapper}>
            {/* Form */}
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                    {editingId ? cfg.editTitle : cfg.addTitle}
                </h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="Amount"
                        value={form.amount}
                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    />
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        onBlur={() => { if (form.description && !form.category) handleSuggestCategory(); }}
                    />
                    <div style={styles.categoryWrapper}>
                        <input
                            style={{ ...styles.input, paddingRight: 36 }}
                            type="text"
                            placeholder={suggesting ? "AI is categorising..." : "Category (auto-filled by AI)"}
                            value={form.category}
                            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                            readOnly={suggesting}
                        />
                        <button type="button" style={styles.categoryBtn} onClick={handleSuggestCategory} disabled={suggesting} title="Re-suggest with AI">
                            {suggesting ? "..." : "AI"}
                        </button>
                    </div>
                    <input
                        style={styles.input}
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                    <div style={styles.btnGroup}>
                        {editingId && (
                            <button type="button" style={styles.btnCancel} onClick={resetForm}>Cancel</button>
                        )}
                        <button style={{ ...styles.btnSubmit, background: cfg.submitBg }} type="submit" disabled={loadingTx}>
                            {loadingTx ? "Saving..." : editingId ? "Update" : cfg.addBtn}
                        </button>
                    </div>
                </form>
            </div>

            <TransactionFilters onFilter={handleFilter} categories={uniqueCategories} />

            {/* List */}
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                    {cfg.historyTitle}
                    {filteredTransactions.length !== allTransactions.length && (
                        <span style={styles.countBadge}>
                            {filteredTransactions.length} of {allTransactions.length}
                        </span>
                    )}
                </h3>
                {filteredTransactions.length === 0 ? (
                    <p style={styles.empty}>
                        {allTransactions.length === 0
                            ? `No ${type} entries yet.`
                            : "No matches found."}
                    </p>
                ) : (
                    <div style={styles.list} className="thin-scroll">
                        {filteredTransactions.map((t) => (
                            <div key={t._id} style={itemStyle(t)}>
                                <div style={styles.itemLeft}>
                                    <div style={styles.itemCategory}>{t.category}</div>
                                    <div style={styles.itemDesc}>{t.description}</div>
                                    <div style={styles.itemDate}>{new Date(t.date).toLocaleDateString()}</div>
                                </div>
                                <div style={styles.itemRight}>
                                    <div style={{ ...styles.itemAmount, color: cfg.amountColor }}>
                                        ₦{t.amount.toLocaleString()}
                                    </div>
                                    <div style={styles.itemActions}>
                                        <button style={styles.btnEdit} onClick={() => handleEdit(t)}>Edit</button>
                                        <button style={styles.btnDelete} onClick={() => handleDelete(t._id)}>Delete</button>
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

const styles = {
    wrapper: { display: "flex", flexDirection: "column", gap: "1.25rem" },
    card: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    cardTitle: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 },
    countBadge: { fontSize: 12, fontWeight: 400, color: "#64748b", background: "#334155", padding: "2px 8px", borderRadius: 20 },
    form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" },
    input: {
        padding: "11px 14px",
        fontSize: 14,
        border: "1.5px solid #334155",
        borderRadius: 12,
        outline: "none",
        background: "#334155",
        color: "#f1f5f9",
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
        background: "rgba(99,102,241,0.2)",
        color: "#818cf8",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "inherit",
        lineHeight: 1.4,
    },
    btnGroup: { display: "flex", gap: "0.5rem", gridColumn: "1 / -1" },
    btnSubmit: { padding: "11px 20px", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    btnCancel: { padding: "11px 14px", fontSize: 14, fontWeight: 500, background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" },
    empty: { fontSize: 14, color: "#64748b", textAlign: "center", padding: "2rem 0" },
    list: { display: "flex", flexDirection: "column", gap: "0.625rem", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" },
    item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", background: "#334155", borderRadius: 12, border: "1px solid transparent", transition: "all 0.2s" },
    itemLeft: { flex: 1 },
    itemCategory: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
    itemDesc: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
    itemDate: { fontSize: 12, color: "#64748b", marginTop: 4 },
    itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" },
    itemAmount: { fontSize: 15, fontWeight: 700 },
    itemActions: { display: "flex", gap: "0.375rem" },
    btnEdit: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid #475569", color: "#94a3b8", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
    btnDelete: { fontSize: 12, padding: "4px 10px", background: "transparent", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" },
};
