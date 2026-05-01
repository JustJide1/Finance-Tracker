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
        dashboard: `Hi, ${user?.firstName ?? ""}`,
        income:    "Income",
        expenses:  "Expenses",
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
            subtitle="Track all your expenses"
            headerRight={<ExportButton />}
        >
            {renderView()}
        </PageLayout>
    );
}
