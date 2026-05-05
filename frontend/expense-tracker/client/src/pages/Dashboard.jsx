import { useState } from "react";
import useAuthStore from "../store/authStore";
import PageLayout from "../components/PageLayout";
import DashboardHome from "../components/DashboardHome";
import TransactionPage from "../components/TransactionPage";
import ExportButton from "../components/ExportButton";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { user } = useAuthStore();

    const tabTitles = {
        dashboard: user?.firstName ? `Hi, ${user.firstName}` : "Dashboard",
        income:    "Balance",
        expenses:  "Transactions",
    };

    const tabSubtitles = {
        income:    "Your income entries",
        expenses:  "Your expense history",
    };

    const renderView = () => {
        switch (activeTab) {
            case "income":   return <TransactionPage key="income" type="income" />;
            case "expenses": return <TransactionPage key="expenses" type="expense" />;
            default:         return <DashboardHome />;
        }
    };

    return (
        <PageLayout
            activeTab={activeTab}
            onNavClick={setActiveTab}
            title={tabTitles[activeTab] ?? tabTitles.dashboard}
            subtitle={tabSubtitles[activeTab]}
            headerRight={<ExportButton />}
        >
            {renderView()}
        </PageLayout>
    );
}
