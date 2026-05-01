export function SkeletonCard() {
    return (
        <div style={styles.card}>
            <div style={{ ...styles.line, width: "40%" }} />
            <div style={{ ...styles.line, width: "70%", height: 28, marginTop: 12 }} />
            <div style={{ ...styles.line, width: "30%", marginTop: 8 }} />
        </div>
    );
}

export function SkeletonList({ count = 3 }) {
    return (
        <div style={styles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={styles.item}>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...styles.line, width: "30%" }} />
                        <div style={{ ...styles.line, width: "60%", marginTop: 8 }} />
                    </div>
                    <div style={{ ...styles.line, width: 80 }} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return <div style={styles.chart} />;
}

const styles = {
    card: {
        background: "#1e293b",
        borderRadius: "clamp(12px, 2vw, 16px)",
        padding: "clamp(1rem, 3vw, 1.5rem)",
        border: "1px solid #334155",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    line: {
        height: 14,
        background: "linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
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
        background: "#334155",
        borderRadius: 12,
        border: "1px solid #475569",
    },
    chart: {
        height: 250,
        background: "linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 12,
        animation: "shimmer 1.5s infinite",
    },
};
