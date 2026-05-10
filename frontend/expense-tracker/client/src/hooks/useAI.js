import { useState, useCallback } from 'react';
import { aiService } from '../api/aiService';
import { useToast } from '../components/Toast';

export const useAI = () => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const suggestCategory = useCallback(async (description) => {
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
    }, [toast]);

    const parseTransaction = useCallback(async (text) => {
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
    }, [toast]);

    const getInsights = useCallback(async (period = 'month') => {
        setLoading(true);
        try {
            const [insightsRes, anomaliesRes] = await Promise.all([
                aiService.getInsights(period),
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
    }, []);

    const forecastSpending = useCallback(async () => {
        setLoading(true);
        try {
            const data = await aiService.forecastSpending();
            return data;
        } catch (err) {
            console.error("Failed to load forecast", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Single request replacing the separate getInsights + getAnomalies + forecastSpending calls
    const getAIDashboard = useCallback(async (period = 'month') => {
        setLoading(true);
        try {
            const data = await aiService.getDashboard(period);
            return data; // { insights, anomaly, forecastData, forecastInsight }
        } catch (err) {
            console.error("Failed to load AI dashboard", err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        suggestCategory,
        parseTransaction,
        getInsights,
        forecastSpending,
        getAIDashboard,
    };
};
