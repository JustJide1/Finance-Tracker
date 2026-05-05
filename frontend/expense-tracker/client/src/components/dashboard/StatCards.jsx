import React from 'react';

export default function StatCards({ stats }) {
    const statCards = [
        // Hero card — primary accent gradient (text-on-dark = white)
        { label: "Account Balance",   value: `₦${stats.balance.toLocaleString()}`,        bg: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)" },
        // Expense card — vivid red gradient
        { label: "Monthly Expenses",  value: `₦${stats.monthlyExpenses.toLocaleString()}`, bg: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" },
        // Income card — green (lighter shade of accent)
        { label: "Total Income",      value: `₦${stats.totalIncome.toLocaleString()}`,     bg: "linear-gradient(135deg, #2D6A4F 0%, #1A4731 100%)" },
        // Warning card — amber
        { label: "Total Expenses",    value: `₦${stats.totalExpenses.toLocaleString()}`,   bg: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" },
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
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        minHeight: 120,
    },
    statLabel: {
        fontSize: "clamp(11px, 2.5vw, 12px)",
        fontWeight: 500,
        color: "rgba(255,255,255,0.85)",   /* text-on-dark */
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    statValue: {
        fontSize: "clamp(20px, 5vw, 28px)",
        fontWeight: 700,
        color: "#FFFFFF",                  /* text-on-dark */
        letterSpacing: "-0.02em",
    },
};
