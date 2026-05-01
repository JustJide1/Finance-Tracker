import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../api/transactionService';

export const useDashboardData = () => {
    const [stats, setStats] = useState({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        monthlyExpenses: 0,
    });
    const [transactions, setTransactions] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, transactionsData] = await Promise.all([
                transactionService.getStats(),
                transactionService.getTransactions(),
            ]);
            
            setStats(statsData);
            setTransactions(transactionsData);
            setRecentTransactions(transactionsData.slice(0, 5));
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        stats,
        transactions,
        recentTransactions,
        loading,
        fetchData
    };
};
