import axios from './axios';

export const authService = {
    register: async (payload) => {
        const response = await axios.post('/auth/register', payload);
        return response.data;
    },
    login: async (payload) => {
        const response = await axios.post('/auth/login', payload);
        return response.data;
    },
    updateProfile: async (payload) => {
        const response = await axios.put('/auth/profile', payload);
        return response.data;
    },
    getProfile: async () => {
        const response = await axios.get('/auth/profile');
        return response.data;
    },
    changePassword: async (payload) => {
        const response = await axios.put('/auth/change-password', payload);
        return response.data;
    },
    deleteAccount: async (payload) => {
        const response = await axios.delete('/auth/account', { data: payload });
        return response.data;
    }
};
