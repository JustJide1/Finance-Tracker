import axios from './axios';

export const aiService = {
    suggestCategory: async (description) => {
        const response = await axios.post('/ai/suggest-category', { description });
        return response.data;
    },
    parseTransaction: async (text) => {
        const response = await axios.post('/ai/parse-transaction', { text });
        return response.data;
    },
    getInsights: async (period = 'month') => {
        const response = await axios.get(`/ai/insights?period=${period}`);
        return response.data;
    },
    getAnomalies: async () => {
        const response = await axios.get('/ai/anomalies');
        return response.data;
    },
    forecastSpending: async () => {
        const response = await axios.get('/ai/forecast');
        return response.data;
    },
    getCategoryAccuracy: async () => {
        const response = await axios.get('/ai/accuracy');
        return response.data;
    },
    // Returns { insights, anomaly, forecastData, forecastInsight } in one request
    getDashboard: async (period = 'month') => {
        const response = await axios.get(`/ai/dashboard?period=${period}`);
        return response.data;
    },
};
