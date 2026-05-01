import { useState, useCallback } from 'react';
import { budgetService } from '../api/budgetService';
import { useToast } from '../components/Toast';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await budgetService.getBudgets();
            setBudgets(data);
        } catch (err) {
            console.error("Failed to fetch budgets");
        } finally {
            setLoading(false);
        }
    }, []);

    const createBudget = async (payload) => {
        setLoading(true);
        try {
            await budgetService.createBudget(payload);
            toast.success("Budget added");
            await fetchBudgets();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateBudget = async (id, payload) => {
        setLoading(true);
        try {
            await budgetService.updateBudget(id, payload);
            toast.success("Budget updated");
            await fetchBudgets();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteBudget = async (id) => {
        try {
            await budgetService.deleteBudget(id);
            toast.success("Budget deleted");
            await fetchBudgets();
        } catch (err) {
            toast.error("Failed to delete");
            throw err;
        }
    };

    return {
        budgets,
        loading,
        fetchBudgets,
        createBudget,
        updateBudget,
        deleteBudget
    };
};
