import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Sidebar from "./Sidebar";

/**
 * Shared shell used by Dashboard, Budget, Profile, and Recurring.
 * Owns sidebar open/close state and logout so pages don't have to.
 *
 * Props:
 *   activeTab     — which sidebar item is highlighted
 *   onNavClick    — called when sidebar selects a tab (only fires for
 *                   dashboard/income/expenses — routed tabs are handled
 *                   inside Sidebar itself)
 *   title         — page heading
 *   subtitle      — optional subheading (hidden on mobile unless .subgreeting)
 *   headerRight   — optional node rendered left of the avatar (e.g. ExportButton)
 *   contentStyle  — optional style overrides for the scrollable content div
 *   children      — page body
 */
export default function PageLayout({
    activeTab,
    onNavClick,
    title,
    subtitle,
    headerRight,
    contentStyle,
    children,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate("/"); };

    return (
        <div style={styles.shell} className="dashboard-shell">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setSidebarOpen(false);
                    onNavClick?.(tab);
                }}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {sidebarOpen && (
                <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            <div style={styles.main}>
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <button
                            className="menu-btn"
                            style={styles.menuBtn}
                            onClick={() => setSidebarOpen(s => !s)}
                        >
                            ☰
                        </button>
                        <div>
                            <h1 style={styles.greeting}>{title}</h1>
                            {subtitle && (
                                <p className="subgreeting" style={styles.subgreeting}>{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <div style={styles.headerRight}>
                        {headerRight}
                        <div
                            style={styles.avatar}
                            onClick={() => navigate("/profile")}
                            title="Profile"
                        >
                            {user?.firstName?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </header>

                <div style={{ ...styles.content, ...contentStyle }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

const styles = {
    shell: {
        display: "flex",
        height: "100vh",
        background: "#0f172a",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        position: "relative",
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 40,
    },
    main: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 },
    header: {
        background: "rgba(15,23,42,0.95)",
        backdropFilter: "blur(12px)",
        padding: "0.875rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #334155",
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: "1rem",
        flexWrap: "wrap",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 },
    menuBtn: {
        display: "none",
        fontSize: 22,
        background: "transparent",
        border: "none",
        color: "#94a3b8",
        cursor: "pointer",
        padding: "0.375rem",
        lineHeight: 1,
    },
    greeting: {
        fontSize: "clamp(15px, 4vw, 20px)",
        fontWeight: 700,
        color: "#f1f5f9",
        margin: 0,
        letterSpacing: "-0.3px",
    },
    subgreeting: { fontSize: "clamp(11px, 2.5vw, 13px)", color: "#64748b", margin: "2px 0 0", display: "none" },
    headerRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#6366f1",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        flexShrink: 0,
    },
    content: { padding: "clamp(1rem, 3vw, 2rem)", flex: 1 },
};

// Mobile responsive styles — runs once at module load
if (typeof window !== 'undefined') {
    const styleId = 'layout-mobile-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @media (max-width: 768px) {
                .menu-btn { display: flex !important; align-items: center; justify-content: center; }
                .subgreeting { display: block !important; }
            }
            @media (min-width: 769px) {
                .mobile-overlay { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }
}
