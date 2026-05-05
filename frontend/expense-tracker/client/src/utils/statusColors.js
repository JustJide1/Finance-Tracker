export const getStatusColor = (status) => {
    switch (status) {
        case "safe":     return { bg: "#2D6A4F", light: "rgba(45,106,79,0.10)",   text: "#2D6A4F" };
        case "moderate": return { bg: "#D97706", light: "rgba(217,119,6,0.10)",   text: "#D97706" };
        case "warning":  return { bg: "#F59E0B", light: "rgba(245,158,11,0.10)",  text: "#B45309" };
        case "exceeded": return { bg: "#DC2626", light: "rgba(220,38,38,0.08)",   text: "#DC2626" };
        default:         return { bg: "#9CA3AF", light: "rgba(156,163,175,0.10)", text: "#6B7280" };
    }
};
