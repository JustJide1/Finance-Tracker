import { useState, useRef } from "react";

export default function TransactionFilters({ onFilter, categories = [] }) {
    const [filters, setFilters] = useState({ search: "", category: "", startDate: "", endDate: "" });
    const [expanded, setExpanded] = useState(false);
    const searchTimer = useRef(null);

    const handleChange = (key, value) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);
        if (key === "search") {
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => onFilter(updated), 300);
        } else {
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
        <div style={S.wrapper}>
            <div style={S.searchRow}>
                <div style={S.searchWrapper}>
                    <input
                        style={S.searchInput}
                        type="text"
                        placeholder="Search by description or category..."
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                    />
                </div>
                <button
                    style={{ ...S.filterToggle, ...(expanded ? S.filterToggleActive : {}) }}
                    onClick={() => setExpanded(!expanded)}
                >
                    Filters {hasActiveFilters && <span style={S.activeDot} />}
                </button>
                {hasActiveFilters && (
                    <button style={S.resetBtn} onClick={handleReset}>Clear</button>
                )}
            </div>

            {expanded && (
                <div style={S.filtersGrid}>
                    <div style={S.field}>
                        <label style={S.label} htmlFor="filter-category">Category</label>
                        <select style={S.input} id="filter-category" value={filters.category} onChange={(e) => handleChange("category", e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div style={S.field}>
                        <label style={S.label} htmlFor="filter-startDate">From</label>
                        <input style={S.input} id="filter-startDate" type="date" value={filters.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
                    </div>
                    <div style={S.field}>
                        <label style={S.label} htmlFor="filter-endDate">To</label>
                        <input style={S.input} id="filter-endDate" type="date" value={filters.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    wrapper: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "1rem",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    searchRow: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
    searchWrapper: { flex: 1, minWidth: 200 },
    searchInput: {
        width: "100%",
        padding: "10px 14px",
        fontSize: 14,
        border: "1.5px solid #E5E7EB",
        borderRadius: 10,
        outline: "none",
        background: "#F9FAFB",
        color: "#111111",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    filterToggle: {
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 500,
        background: "#F9FAFB",
        border: "1.5px solid #E5E7EB",
        borderRadius: 10,
        cursor: "pointer",
        color: "#6B7280",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "inherit",
        position: "relative",
    },
    filterToggleActive: {
        background: "rgba(45,106,79,0.08)",
        borderColor: "#2D6A4F",
        color: "#2D6A4F",
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#2D6A4F",
        display: "inline-block",
    },
    resetBtn: {
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        border: "1.5px solid rgba(220,38,38,0.3)",
        borderRadius: 10,
        cursor: "pointer",
        color: "#DC2626",
        fontFamily: "inherit",
    },
    filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "0.75rem",
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #E5E7EB",
    },
    field: { display: "flex", flexDirection: "column" },
    label: {
        fontSize: 11,
        fontWeight: 600,
        color: "#9CA3AF",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    input: {
        padding: "9px 12px",
        fontSize: 13,
        border: "1.5px solid #E5E7EB",
        borderRadius: 10,
        outline: "none",
        background: "#F9FAFB",
        color: "#111111",
        fontFamily: "inherit",
    },
};
