import { useState, useCallback, memo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useAI } from "../hooks/useAI";
import { useToast } from "./Toast";
import CATEGORIES from "../constants/categories";

const EXAMPLES = ["Spent 2k on lunch today", "Got paid 10k for salary"];

const REVIEW_FIELDS = [
    { label: "Type", field: "type", type: "select", options: ["expense", "income"] },
    { label: "Amount (₦)", field: "amount", type: "number" },
    { label: "Category", field: "category", type: "select", options: CATEGORIES },
    { label: "Description", field: "description", type: "text" },
    { label: "Date", field: "date", type: "date" },
];

const S = {
    card: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    header: { marginBottom: "1.25rem" },
    title: { fontSize: 15, fontWeight: 600, color: "#111111", margin: 0 },
    subtitle: { fontSize: 12, color: "#9CA3AF", margin: "3px 0 0" },
    form: { display: "flex", gap: "0.5rem", marginBottom: "0.875rem" },
    input: {
        flex: 1,
        padding: "11px 14px",
        fontSize: 14,
        border: "1.5px solid #E5E7EB",
        borderRadius: 12,
        background: "#F9FAFB",
        color: "#111111",
        outline: "none",
        fontFamily: "inherit",
    },
    btn: {
        padding: "11px 24px",
        fontSize: 14,
        fontWeight: 600,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        minWidth: 80,
        fontFamily: "inherit",
    },
    examples: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" },
    examplesLabel: { fontSize: 12, color: "#9CA3AF" },
    exampleChip: {
        fontSize: 12,
        padding: "5px 11px",
        background: "rgba(45,106,79,0.08)",
        border: "1px solid rgba(45,106,79,0.18)",
        color: "#2D6A4F",
        borderRadius: 20,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    review: {
        marginTop: "1rem",
        padding: "1.25rem",
        background: "#F9FAFB",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
    },
    reviewHeader: { marginBottom: "1rem" },
    confidenceBadge: { display: "inline-block", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
    missing: { fontSize: 12, color: "#9CA3AF", margin: "8px 0 0" },
    reviewFields: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        marginBottom: "1rem",
    },
    field: { display: "flex", flexDirection: "column" },
    label: { fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" },
    fieldInput: {
        padding: "9px 12px",
        fontSize: 13,
        border: "1.5px solid #E5E7EB",
        borderRadius: 10,
        outline: "none",
        background: "#FFFFFF",
        color: "#111111",
        fontFamily: "inherit",
    },
    actions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
    btnCancel: {
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        color: "#6B7280",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    btnConfirm: {
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 600,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
    },
};

const CONFIDENCE_STYLES = {
    high: { ...S.confidenceBadge, background: "rgba(45,106,79,0.10)", color: "#2D6A4F" },
    medium: { ...S.confidenceBadge, background: "rgba(217,119,6,0.10)", color: "#D97706" },
    low: { ...S.confidenceBadge, background: "rgba(220,38,38,0.08)", color: "#DC2626" },
};

const ExampleChip = memo(({ text, onClick }) => {
    const handleClick = useCallback(() => onClick(text), [onClick, text]);
    return <button style={S.exampleChip} onClick={handleClick}>{text}</button>;
});

const ParsedField = memo(({ field, label, type, options, value, onChange }) => {
    const handleChange = useCallback((e) => {
        onChange(field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value);
    }, [field, type, onChange]);

    const inputId = `quickadd-${field}`;
    return (
        <div style={S.field}>
            <label style={S.label} htmlFor={inputId}>{label}</label>
            {type === "select" ? (
                <select style={S.fieldInput} id={inputId} value={value} onChange={handleChange}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : (
                <input
                    style={S.fieldInput}
                    id={inputId}
                    type={type}
                    value={type === "number" && value === 0 ? "" : value}
                    placeholder={type === "number" ? "Enter amount" : undefined}
                    onFocus={type === "number" ? (e) => e.target.select() : undefined}
                    onChange={handleChange}
                />
            )}
        </div>
    );
});

function QuickAdd({ onSuccess }) {
    const [input, setInput] = useState("");
    const [parsed, setParsed] = useState(null);
    const toast = useToast();

    const { createTransaction } = useTransactions();
    const { parseTransaction, loading: parsing } = useAI();

    const saveTransaction = useCallback(async (data, aiMeta) => {
        try {
            await createTransaction({
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                aiSuggestedCategory: aiMeta?.aiSuggestedCategory ?? null,
                aiConfidence: aiMeta?.aiConfidence ?? null,
                userOverrode: aiMeta?.userOverrode ?? false,
            });
            if (onSuccess) onSuccess();
        } catch {
            // Error handled by hook
        }
    }, [createTransaction, onSuccess]);

    const handleParse = useCallback(async (e) => {
        e.preventDefault();
        if (input.trim().length < 4) {
            return toast.error("Please describe the transaction in a few words (e.g. 'Spent 2k on food')");
        }
        const data = await parseTransaction(input);
        if (!data) return;

        const isConfident = data.confidence === "high" || data.confidence === "medium";
        if (isConfident && data.amount > 0 && (!data.missingFields || data.missingFields.length === 0)) {
            await saveTransaction(data, { aiSuggestedCategory: data.category, aiConfidence: data.confidence, userOverrode: false });
            setInput("");
        } else {
            setParsed({ ...data, _aiCategory: data.category, _aiConfidence: data.confidence });
        }
    }, [input, parseTransaction, saveTransaction, toast]);

    const handleConfirm = useCallback(async () => {
        if (!parsed?.amount || parsed.amount <= 0) return toast.error("Please enter a valid amount");
        await saveTransaction(parsed, {
            aiSuggestedCategory: parsed._aiCategory ?? null,
            aiConfidence: parsed._aiConfidence ?? null,
            userOverrode: parsed.category !== parsed._aiCategory,
        });
        setInput("");
        setParsed(null);
    }, [parsed, saveTransaction, toast]);

    const handleEdit = useCallback((field, value) => {
        setParsed(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const handleChangeInput = useCallback((e) => setInput(e.target.value), []);

    return (
        <div style={S.card}>
            <div style={S.header}>
                <div>
                    <h3 style={S.title}>Quick Add with AI</h3>
                    <p style={S.subtitle}>Type naturally, we'll understand your request</p>
                </div>
            </div>

            <form onSubmit={handleParse} style={S.form}>
                <input
                    style={S.input}
                    type="text"
                    placeholder='e.g., "Spent 1k on food today"'
                    value={input}
                    onChange={handleChangeInput}
                    disabled={parsing}
                />
                <button style={S.btn} type="submit" disabled={parsing}>
                    {parsing ? "Parsing..." : "Add"}
                </button>
            </form>

            {!parsed && (
                <div style={S.examples}>
                    <span style={S.examplesLabel}>Try:</span>
                    {EXAMPLES.map((ex, i) => (
                        <ExampleChip key={i} text={ex} onClick={setInput} />
                    ))}
                </div>
            )}

            {parsed && (
                <div style={S.review}>
                    <div style={S.reviewHeader}>
                        <span style={CONFIDENCE_STYLES[parsed.confidence] || CONFIDENCE_STYLES.low}>
                            {parsed.confidence === "low" ? "Low confidence — please verify" : "Please confirm"}
                        </span>
                        {parsed.missingFields?.length > 0 && (
                            <p style={S.missing}>Missing: {parsed.missingFields.join(", ")}</p>
                        )}
                    </div>

                    <div style={S.reviewFields}>
                        {REVIEW_FIELDS.map((fieldData) => (
                            <ParsedField
                                key={fieldData.field}
                                {...fieldData}
                                value={parsed[fieldData.field]}
                                onChange={handleEdit}
                            />
                        ))}
                    </div>

                    <div style={S.actions}>
                        <button style={S.btnCancel} onClick={() => setParsed(null)}>Cancel</button>
                        <button style={S.btnConfirm} onClick={handleConfirm}>Confirm & Save</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(QuickAdd);

