import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success", duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const success = useCallback((msg) => showToast(msg, "success"), [showToast]);
    const error   = useCallback((msg) => showToast(msg, "error"),   [showToast]);
    const info    = useCallback((msg) => showToast(msg, "info"),    [showToast]);
    const warning = useCallback((msg) => showToast(msg, "warning"), [showToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            <div style={styles.container}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }}>
                        <span style={{ ...styles.icon, ...iconStyles[toast.type] }}>{getIcon(toast.type)}</span>
                        <span style={styles.message}>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

const getIcon = (type) => {
    switch (type) {
        case "success": return "✓";
        case "error":   return "✕";
        case "warning": return "!";
        case "info":    return "i";
        default:        return "•";
    }
};

const styles = {
    container: {
        position: "fixed",
        top: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "calc(100vw - 3rem)",
        pointerEvents: "none",
    },
    toast: {
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "12px 16px",
        borderRadius: 12,
        minWidth: 280,
        maxWidth: 400,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        animation: "slideIn 0.3s ease",
        pointerEvents: "auto",
        backdropFilter: "blur(12px)",
    },
    success: {
        background: "rgba(16,185,129,0.15)",
        color: "#34d399",
        border: "1px solid rgba(16,185,129,0.3)",
    },
    error: {
        background: "rgba(244,63,94,0.15)",
        color: "#fb7185",
        border: "1px solid rgba(244,63,94,0.3)",
    },
    warning: {
        background: "rgba(245,158,11,0.15)",
        color: "#fbbf24",
        border: "1px solid rgba(245,158,11,0.3)",
    },
    info: {
        background: "rgba(99,102,241,0.15)",
        color: "#a5b4fc",
        border: "1px solid rgba(99,102,241,0.3)",
    },
    icon: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
    },
    message: { flex: 1, lineHeight: 1.4 },
};

const iconStyles = {
    success: { background: "rgba(16,185,129,0.25)" },
    error:   { background: "rgba(244,63,94,0.25)" },
    warning: { background: "rgba(245,158,11,0.25)" },
    info:    { background: "rgba(99,102,241,0.25)" },
};
