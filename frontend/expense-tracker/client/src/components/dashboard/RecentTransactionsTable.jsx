import React from 'react';

export default function RecentTransactionsTable({ transactions, onRefresh }) {
    return (
        <div style={styles.tableCard}>
            <div style={styles.tableCardHeader}>
                <h3 style={styles.cardTitle}>Recent Transactions</h3>
                <button style={styles.refreshBtn} onClick={onRefresh}>
                    Refresh
                </button>
            </div>
            {transactions.length === 0 ? (
                <p style={styles.empty}>No transactions yet. Add some income or expenses to get started.</p>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {["Description", "Category", "Date", "Amount"].map((h) => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t._id} style={styles.tr}>
                                    <td style={styles.td}>{t.description}</td>
                                    <td style={styles.td}>{t.category}</td>
                                    <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                                    <td style={{
                                        ...styles.td,
                                        color: t.type === "expense" ? "#DC2626" : "#2D6A4F", /* expense red | income green */
                                        fontWeight: 600,
                                    }}>
                                        {t.type === "expense" ? "-" : "+"}₦{t.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    tableCard: {
        background: "#FFFFFF",             /* --color-surface */
        borderRadius: "clamp(12px, 2vw, 16px)",
        overflow: "hidden",
        border: "1px solid #D1D5DB",       /* --color-border */
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    },
    tableCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        borderBottom: "1px solid #E5E7EB", /* chart-grid / divider */
        gap: "1rem",
        flexWrap: "wrap",
    },
    cardTitle: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#111111", margin: 0 },
    empty: { fontSize: 14, color: "#6B7280", textAlign: "center", padding: "2rem" },
    tableWrapper: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 500 },
    th: {
        padding: "clamp(10px, 2vw, 12px) clamp(12px, 3vw, 24px)",
        fontSize: "clamp(10px, 2vw, 11px)",
        fontWeight: 600,
        color: "#6B7280",               /* text-secondary */
        textAlign: "left",
        background: "#F5F5F5",          /* surfaceAlt */
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
    },
    tr: { borderTop: "1px solid #E5E7EB" }, /* chart-grid */
    td: {
        padding: "clamp(12px, 2.5vw, 14px) clamp(12px, 3vw, 24px)",
        fontSize: "clamp(12px, 2.5vw, 14px)",
        color: "#374151",               /* slightly darker than text-secondary for readability */
        whiteSpace: "nowrap",
    },
    refreshBtn: {
        fontSize: 13,
        fontWeight: 600,
        color: "#2D6A4F",               /* accent */
        background: "rgba(45,106,79,0.08)",
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px solid rgba(45,106,79,0.25)",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
};
