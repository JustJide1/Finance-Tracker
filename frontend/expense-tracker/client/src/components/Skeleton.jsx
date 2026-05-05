export function SkeletonCard() {
    return (
        <div style={S.card}>
            <div style={{ ...S.line, width: "40%" }} />
            <div style={{ ...S.line, width: "70%", height: 28, marginTop: 12 }} />
            <div style={{ ...S.line, width: "30%", marginTop: 8 }} />
        </div>
    );
}

export function SkeletonList({ count = 3 }) {
    return (
        <div style={S.list}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={S.item}>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...S.line, width: "30%" }} />
                        <div style={{ ...S.line, width: "60%", marginTop: 8 }} />
                    </div>
                    <div style={{ ...S.line, width: 80 }} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return <div style={S.chart} />;
}

const S = {
    card: {
        background: "#FFFFFF",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    line: {
        height: 14,
        background: "linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 6,
        animation: "shimmer 1.5s infinite",
    },
    list: { display: "flex", flexDirection: "column", gap: "0.625rem" },
    item: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.875rem 1rem",
        background: "#F9FAFB",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
    },
    chart: {
        height: 250,
        background: "linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 12,
        animation: "shimmer 1.5s infinite",
    },
};
