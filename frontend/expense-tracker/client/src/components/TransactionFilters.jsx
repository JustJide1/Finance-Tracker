import { useState, useRef } from "react";

export default function TransactionFilters({ onFilter, categories = [] }) {
    const [filters, setFilters] = useState({ search: "", category: "", startDate: "", endDate: "" });
    const [expanded, setExpanded] = useState(false);
    const searchTimer = useRef(null);

    const handleChange = (key, value) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);

        if (key === "search") {
            // Debounce free-text search — fire only after user stops typing
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => onFilter(updated), 300);
        } else {
            // Category and date pickers are discrete — fire immediately
            onFilter(updated);
        }
    };

    const handleReset = () => {
        const empty = { search: "", category: "", startDate: "", endDate: "" };
        setFilters(empty);
        onFilter(empty);
    };

    const hasActiveFilters = filters.search || filters.category || filters.startDate || filters.endDate;

    return (
        <div style={styles.wrapper}>
            <div style={styles.searchRow}>
                <div style={styles.searchWrapper}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search by description or category..."
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                    />
                </div>
                <button
                    style={{ ...styles.filterToggle, ...(expanded ? styles.filterToggleActive : {}) }}
                    onClick={() => setExpanded(!expanded)}
                >
                    Filters {hasActiveFilters && <span style={styles.activeDot} />}
                </button>
                {hasActiveFilters && (
                    <button style={styles.resetBtn} onClick={handleReset}>Clear</button>
                )}
            </div>

            {expanded && (
                <div style={styles.filtersGrid}>
                    <div style={styles.field}>
                        <label style={styles.label}>Category</label>
                        <select
                            style={styles.input}
                            value={filters.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>From</label>
                        <input
                            style={styles.input}
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleChange("startDate", e.target.value)}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>To</label>
                        <input
                            style={styles.input}
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleChange("endDate", e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrapper: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "1rem",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    searchRow: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
    searchWrapper: { flex: 1, minWidth: 200 },
    searchInput: {
        width: "100%",
        padding: "10px 14px",
        fontSize: 14,
        border: "1.5px solid #334155",
        borderRadius: 10,
        outline: "none",
        background: "#334155",
        color: "#f1f5f9",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    filterToggle: {
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 500,
        background: "#334155",
        border: "1.5px solid #475569",
        borderRadius: 10,
        cursor: "pointer",
        color: "#94a3b8",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "inherit",
        position: "relative",
    },
    filterToggleActive: {
        background: "rgba(99,102,241,0.12)",
        borderColor: "#6366f1",
        color: "#818cf8",
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#6366f1",
        display: "inline-block",
    },
    resetBtn: {
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        border: "1.5px solid rgba(244,63,94,0.3)",
        borderRadius: 10,
        cursor: "pointer",
        color: "#f43f5e",
        fontFamily: "inherit",
    },
    filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "0.75rem",
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #334155",
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
    input: {
        padding: "9px 12px",
        fontSize: 13,
        border: "1.5px solid #334155",
        borderRadius: 10,
        outline: "none",
        background: "#334155",
        color: "#f1f5f9",
        fontFamily: "inherit",
    },
};
