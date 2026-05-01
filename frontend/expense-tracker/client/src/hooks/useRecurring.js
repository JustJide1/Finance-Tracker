import { useState, useCallback } from 'react';
import { recurringService } from '../api/recurringService';
import { useToast } from '../components/Toast';

export const useRecurring = () => {
    const [recurring, setRecurring] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const fetchRecurring = useCallback(async () => {
        setLoading(true);
        try {
            const data = await recurringService.getRecurring();
            setRecurring(data);
        } catch (err) {
            console.error("Failed to fetch recurring expenses");
        } finally {
            setLoading(false);
        }
    }, []);

    const createRecurring = async (payload) => {
        setLoading(true);
        try {
            await recurringService.createRecurring(payload);
            toast.success("Recurring expense added");
            await fetchRecurring();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateRecurring = async (id, payload) => {
        setLoading(true);
        try {
            await recurringService.updateRecurring(id, payload);
            toast.success("Recurring expense updated");
            await fetchRecurring();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteRecurring = async (id) => {
        try {
            await recurringService.deleteRecurring(id);
            toast.success("Recurring expense deleted");
            await fetchRecurring();
        } catch (err) {
            toast.error("Failed to delete");
            throw err;
        }
    };

    return {
        recurring,
        loading,
        fetchRecurring,
        createRecurring,
        updateRecurring,
        deleteRecurring
    };
};
