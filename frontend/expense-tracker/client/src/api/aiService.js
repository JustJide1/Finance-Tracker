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
    getInsights: async () => {
        const response = await axios.get('/ai/insights');
        return response.data;
    },
    getAnomalies: async () => {
        const response = await axios.get('/ai/anomalies');
        return response.data;
    }
};
