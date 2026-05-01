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
            const data = await transactionService.getTransactions();
            const filtered = type ? data.filter(t => t.type === type) : data;
            setTransactions(filtered);
        } catch (err) {
            console.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    }, [type]);

    const createTransaction = async (payload) => {
        setLoading(true);
        try {
            await transactionService.createTransaction(payload);
            toast.success(type === 'expense' ? "Expense added" : type === 'income' ? "Income added" : "Transaction added");
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

    return {
        transactions,
        loading,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction
    };
};
