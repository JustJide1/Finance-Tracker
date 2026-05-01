import React from "react";
import AIInsights from "./AIInsights";
import MonthlyChart from "./charts/MonthlyChart";
import CategoryChart from "./charts/CategoryChart";
import TrendChart from "./charts/TrendChart";
import QuickAdd from "./QuickAdd";
import BudgetSummary from "./BudgetSummary";
import { SkeletonCard, SkeletonChart, SkeletonList } from "./Skeleton";

// Clean Architecture Components
import { useDashboardData } from "../hooks/useDashboardData";
import StatCards from "./dashboard/StatCards";
import RecentTransactionsTable from "./dashboard/RecentTransactionsTable";

export default function DashboardHome() {
    const { stats, transactions, recentTransactions, loading, fetchData } = useDashboardData();

    if (loading) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.statsGrid}>
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                <div style={styles.chartsRow}>
                    <div style={styles.chartCard}><SkeletonChart /></div>
                    <div style={styles.chartCard}><SkeletonChart /></div>
                </div>
                <div style={styles.tableCard}>
                    <div style={{ padding: "1.5rem" }}><SkeletonList count={5} /></div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <QuickAdd onSuccess={fetchData} />

            <StatCards stats={stats} />

            <div style={styles.chartsRow}>
                <div style={styles.chartCard}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Monthly Overview</h3>
                    </div>
                    <MonthlyChart transactions={transactions} />
                </div>
                <AIInsights />
            </div>

            <div style={styles.chartsRow}>
                <div style={styles.chartCard}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Spending Trend (This Month)</h3>
                    </div>
                    <TrendChart transactions={transactions} />
                </div>
                <BudgetSummary />
            </div>

            <div style={styles.chartCard}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Top Categories</h3>
                </div>
                <CategoryChart transactions={transactions} />
            </div>

            <RecentTransactionsTable
                transactions={recentTransactions}
                onRefresh={fetchData}
            />
        </div>
    );
}

const styles = {
    wrapper: { display: "flex", flexDirection: "column", gap: "clamp(1rem, 2vw, 1.25rem)" },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "clamp(0.75rem, 2vw, 1rem)",
    },
    chartsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "clamp(0.75rem, 2vw, 1rem)",
    },
    chartCard: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.25rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #334155",
    },
    cardTitle: { fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600, color: "#f1f5f9", margin: 0 },
    tableCard: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        overflow: "hidden",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
};
