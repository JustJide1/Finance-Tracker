import { useState, memo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useAI } from "../hooks/useAI";
import { useToast } from "./Toast";

function QuickAdd({ onSuccess }) {
    const [input, setInput] = useState("");
    const [parsed, setParsed] = useState(null);
    const toast = useToast();

    const { createTransaction } = useTransactions();
    const { parseTransaction, loading: parsing } = useAI();

    const handleParse = async (e) => {
        e.preventDefault();
        if (input.trim().length < 10) {
            return toast.error("Please describe the transaction in a few words (e.g. 'Spent 2k on food')");
        }
        const data = await parseTransaction(input);
        if (!data) return;

        const hasAmount      = data.amount > 0;
        const noMissing      = !data.missingFields || data.missingFields.length === 0;
        const isConfident    = data.confidence === "high" || data.confidence === "medium";

        if (isConfident && hasAmount && noMissing) {
            // All fields resolved cleanly — save instantly, no confirm screen
            await saveTransaction(data);
            setInput("");
        } else {
            // Low confidence, zero amount, or missing fields — let user review
            setParsed(data);
        }
    };

    const saveTransaction = async (data) => {
        try {
            await createTransaction({
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
            });
            if (onSuccess) onSuccess();
        } catch(err) {
            // Error handled by hook
        }
    };

    const handleConfirm = async () => {
        if (!parsed.amount || parsed.amount <= 0) {
            return toast.error("Please enter a valid amount");
        }
        await saveTransaction(parsed);
        setInput("");
        setParsed(null);
    };

    const handleEdit = (field, value) => setParsed({ ...parsed, [field]: value });
    const handleCancel = () => setParsed(null);

    const examples = ["Spent 2k on lunch today", "Got paid 10k for salary"];

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>Quick Add with AI</h3>
                    <p style={styles.subtitle}>Type naturally — we'll parse the rest</p>
                </div>
            </div>

            <form onSubmit={handleParse} style={styles.form}>
                <input
                    style={styles.input}
                    type="text"
                    placeholder='e.g., "Spent 1k on food today"'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={parsing}
                />
                <button style={styles.btn} type="submit" disabled={parsing}>
                    {parsing ? "Parsing..." : "Add"}
                </button>
            </form>

            {!parsed && (
                <div style={styles.examples}>
                    <span style={styles.examplesLabel}>Try:</span>
                    {examples.map((ex, i) => (
                        <button key={i} style={styles.exampleChip} onClick={() => setInput(ex)}>
                            {ex}
                        </button>
                    ))}
                </div>
            )}

            {parsed && (
                <div style={styles.review}>
                    <div style={styles.reviewHeader}>
                        <span style={{ ...styles.confidenceBadge, ...getConfidenceStyle(parsed.confidence) }}>
                            {parsed.confidence === "low" ? "Low confidence — please verify" : "Please confirm"}
                        </span>
                        {parsed.missingFields?.length > 0 && (
                            <p style={styles.missing}>Missing: {parsed.missingFields.join(", ")}</p>
                        )}
                    </div>

                    <div style={styles.reviewFields}>
                        {[
                            { label: "Type", field: "type", type: "select", options: ["expense", "income"] },
                            { label: "Amount (₦)", field: "amount", type: "number" },
                            { label: "Category", field: "category", type: "text" },
                            { label: "Description", field: "description", type: "text" },
                            { label: "Date", field: "date", type: "date" },
                        ].map(({ label, field, type, options }) => (
                            <div key={field} style={styles.field}>
                                <label style={styles.label}>{label}</label>
                                {type === "select" ? (
                                    <select
                                        style={styles.fieldInput}
                                        value={parsed[field]}
                                        onChange={(e) => handleEdit(field, e.target.value)}
                                    >
                                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        style={styles.fieldInput}
                                        type={type}
                                        value={field === "amount" && parsed[field] === 0 ? "" : parsed[field]}
                                        placeholder={field === "amount" ? "Enter amount" : undefined}
                                        onFocus={field === "amount" ? (e) => e.target.select() : undefined}
                                        onChange={(e) => handleEdit(field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={styles.actions}>
                        <button style={styles.btnCancel} onClick={handleCancel}>Cancel</button>
                        <button style={styles.btnConfirm} onClick={handleConfirm}>Confirm & Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const getConfidenceStyle = (confidence) => {
    if (confidence === "high")   return { background: "rgba(16,185,129,0.15)", color: "#34d399" };
    if (confidence === "medium") return { background: "rgba(245,158,11,0.15)", color: "#fbbf24" };
    return { background: "rgba(244,63,94,0.15)", color: "#fb7185" };
};

const styles = {
    card: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    header: { marginBottom: "1.25rem" },
    title: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", margin: 0 },
    subtitle: { fontSize: 12, color: "#64748b", margin: "3px 0 0" },
    form: { display: "flex", gap: "0.5rem", marginBottom: "0.875rem" },
    input: {
        flex: 1,
        padding: "11px 14px",
        fontSize: 14,
        border: "1.5px solid #334155",
        borderRadius: 12,
        background: "#334155",
        color: "#f1f5f9",
        outline: "none",
        fontFamily: "inherit",
    },
    btn: {
        padding: "11px 24px",
        fontSize: 14,
        fontWeight: 600,
        background: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        minWidth: 80,
        fontFamily: "inherit",
    },
    examples: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" },
    examplesLabel: { fontSize: 12, color: "#64748b" },
    exampleChip: {
        fontSize: 12,
        padding: "5px 11px",
        background: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.2)",
        color: "#818cf8",
        borderRadius: 20,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    review: {
        marginTop: "1rem",
        padding: "1.25rem",
        background: "#0f172a",
        borderRadius: 12,
        border: "1px solid #334155",
    },
    reviewHeader: { marginBottom: "1rem" },
    confidenceBadge: {
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
    },
    missing: { fontSize: 12, color: "#64748b", margin: "8px 0 0" },
    reviewFields: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1rem",
    },
    field: { display: "flex", flexDirection: "column" },
    label: {
        fontSize: 11,
        fontWeight: 600,
        color: "#64748b",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    fieldInput: {
        padding: "9px 12px",
        fontSize: 13,
        border: "1.5px solid #334155",
        borderRadius: 10,
        outline: "none",
        background: "#1e293b",
        color: "#f1f5f9",
        fontFamily: "inherit",
    },
    actions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
    btnCancel: {
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        color: "#94a3b8",
        border: "1px solid #334155",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    btnConfirm: {
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 600,
        background: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
};

export default memo(QuickAdd);
