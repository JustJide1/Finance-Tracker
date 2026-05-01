export const getStatusColor = (status) => {
    switch (status) {
        case "safe":     return { bg: "#10b981", light: "rgba(16,185,129,0.12)",  text: "#34d399" };
        case "moderate": return { bg: "#6366f1", light: "rgba(99,102,241,0.12)", text: "#818cf8" };
        case "warning":  return { bg: "#f59e0b", light: "rgba(245,158,11,0.12)", text: "#fbbf24" };
        case "exceeded": return { bg: "#f43f5e", light: "rgba(244,63,94,0.12)",  text: "#fb7185" };
        default:         return { bg: "#64748b", light: "rgba(100,116,139,0.12)", text: "#94a3b8" };
    }
};
