import React from 'react';

export default function StatCards({ stats }) {
    const statCards = [
        { label: "Account Balance", value: `₦${stats.balance.toLocaleString()}`, bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" },
        { label: "Monthly Expenses", value: `₦${stats.monthlyExpenses.toLocaleString()}`, bg: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)" },
        { label: "Total Income", value: `₦${stats.totalIncome.toLocaleString()}`, bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
        { label: "Total Expenses", value: `₦${stats.totalExpenses.toLocaleString()}`, bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
    ];

    return (
        <div style={styles.statsGrid}>
            {statCards.map((s) => (
                <div key={s.label} style={{ ...styles.statCard, background: s.bg }}>
                    <div style={styles.statLabel}>{s.label}</div>
                    <div style={styles.statValue}>{s.value}</div>
                </div>
            ))}
        </div>
    );
}

const styles = {
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "clamp(0.75rem, 2vw, 1rem)",
    },
    statCard: {
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        minHeight: 120,
    },
    statLabel: {
        fontSize: "clamp(11px, 2.5vw, 12px)",
        fontWeight: 500,
        color: "rgba(255,255,255,0.8)",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    statValue: {
        fontSize: "clamp(20px, 5vw, 28px)",
        fontWeight: 700,
        color: "#ffffff",
        letterSpacing: "-0.02em",
    },
};
