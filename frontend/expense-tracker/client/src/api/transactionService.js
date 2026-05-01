import axios from './axios';

export const transactionService = {
    getStats: async () => {
        const response = await axios.get('/transactions/stats');
        return response.data;
    },
    getTransactions: async () => {
        const response = await axios.get('/transactions');
        return response.data;
    },
    createTransaction: async (payload) => {
        const response = await axios.post('/transactions', payload);
        return response.data;
    },
    updateTransaction: async (id, payload) => {
        const response = await axios.put(`/transactions/${id}`, payload);
        return response.data;
    },
    deleteTransaction: async (id) => {
        const response = await axios.delete(`/transactions/${id}`);
        return response.data;
    }
};
