import axios from './axios';

export const budgetService = {
    getBudgets: async () => {
        const response = await axios.get('/budgets');
        return response.data;
    },
    createBudget: async (payload) => {
        const response = await axios.post('/budgets', payload);
        return response.data;
    },
    updateBudget: async (id, payload) => {
        const response = await axios.put(`/budgets/${id}`, payload);
        return response.data;
    },
    deleteBudget: async (id) => {
        const response = await axios.delete(`/budgets/${id}`);
        return response.data;
    }
};
