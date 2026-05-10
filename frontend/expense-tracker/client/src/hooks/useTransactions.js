import { useState, useCallback } from 'react';
import { transactionService } from '../api/transactionService';
import { useToast } from '../components/Toast';

export const useTransactions = (type) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            // Pass type to the server so only matching documents are fetched
            const params = type ? { type, limit: 200 } : { limit: 200 };
            const { transactions: data } = await transactionService.getTransactions(params);
            setTransactions(data);
        } catch (err) {
            console.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    }, [type]);

    const createTransaction = async (payload) => {
        setLoading(true);
        try {
            const data = await transactionService.createTransaction(payload);
            toast.success(type === 'expense' ? "Expense added" : type === 'income' ? "Income added" : "Transaction added");
            if (data?.budgetAlert) {
                const { level, message } = data.budgetAlert;
                if (level === 'exceeded') {
                    toast.error(message);
                } else {
                    toast.warning(message);
                }
            }
            await fetchTransactions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateTransaction = async (id, payload) => {
        setLoading(true);
        try {
            await transactionService.updateTransaction(id, payload);
            toast.success(type === 'expense' ? "Expense updated" : type === 'income' ? "Income updated" : "Transaction updated");
            await fetchTransactions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await transactionService.deleteTransaction(id);
            toast.success(type === 'expense' ? "Expense deleted" : type === 'income' ? "Income deleted" : "Transaction deleted");
            await fetchTransactions();
        } catch (err) {
            toast.error("Failed to delete");
            throw err;
        }
    };

    const deleteAllExpenses = async () => {
        setLoading(true);
        try {
            await transactionService.deleteAllExpenses();
            toast.success("All expenses cleared");
            await fetchTransactions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to clear expenses");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAllIncome = async () => {
        setLoading(true);
        try {
            await transactionService.deleteAllIncome();
            toast.success("All income cleared");
            await fetchTransactions();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to clear income");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        transactions,
        loading,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAllExpenses,
        deleteAllIncome
    };
};
