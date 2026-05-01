import { useState } from 'react';
import { aiService } from '../api/aiService';
import { useToast } from '../components/Toast';

export const useAI = () => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const suggestCategory = async (description) => {
        setLoading(true);
        try {
            const data = await aiService.suggestCategory(description);
            return data.category;
        } catch (err) {
            toast.error("Failed to suggest category");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const parseTransaction = async (text) => {
        setLoading(true);
        try {
            const data = await aiService.parseTransaction(text);
            return data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to parse. Try again.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getInsights = async () => {
        setLoading(true);
        try {
            const [insightsRes, anomaliesRes] = await Promise.all([
                aiService.getInsights(),
                aiService.getAnomalies()
            ]);
            return {
                insights: insightsRes.insights || [],
                anomaly: anomaliesRes.alert
            };
        } catch (err) {
            console.error("Failed to load insights");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        suggestCategory,
        parseTransaction,
        getInsights
    };
};
