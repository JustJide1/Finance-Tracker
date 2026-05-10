import axios from './axios';

export const transactionService = {
    getDashboard: async () => {
        const response = await axios.get('/dashboard');
        return response.data; // { stats, transactions }
    },
    getStats: async () => {
        const response = await axios.get('/transactions/stats');
        return response.data;
    },
    // params: { type, category, search, startDate, endDate, page, limit }
    getTransactions: async (params = {}) => {
        const response = await axios.get('/transactions', { params });
        return response.data; // { transactions, pagination }
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
    },
    deleteAllExpenses: async () => {
        const response = await axios.delete('/transactions/expenses/all');
        return response.data;
    },
    deleteAllIncome: async () => {
        const response = await axios.delete('/transactions/income/all');
        return response.data;
    }
};
