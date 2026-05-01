import axios from './axios';

export const recurringService = {
    getRecurring: async () => {
        const response = await axios.get('/recurring');
        return response.data;
    },
    createRecurring: async (payload) => {
        const response = await axios.post('/recurring', payload);
        return response.data;
    },
    updateRecurring: async (id, payload) => {
        const response = await axios.put(`/recurring/${id}`, payload);
        return response.data;
    },
    deleteRecurring: async (id) => {
        const response = await axios.delete(`/recurring/${id}`);
        return response.data;
    }
};
