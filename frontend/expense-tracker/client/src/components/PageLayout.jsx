import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Sidebar from "./Sidebar";

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
        <div style={S.shell} className="dashboard-shell">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => { setSidebarOpen(false); onNavClick?.(tab); }}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {sidebarOpen && (
                <div style={S.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            <div style={S.main} className="thin-scroll">
                {/* Top bar */}
                <header style={S.header}>
                    <div style={S.headerLeft}>
                        <button
                            className="menu-btn"
                            style={S.menuBtn}
                            onClick={() => setSidebarOpen(s => !s)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <div style={S.headerTitles}>
                            <h1 style={S.greetingTitle}>{title}</h1>
                            {subtitle && <p style={S.greetingSub}>{subtitle}</p>}
                        </div>
                    </div>

                    <div style={S.headerRight}>
                        {headerRight}

                        {/* User chip */}
                        <button
                            style={S.userChip}
                            onClick={() => navigate("/profile")}
                            title="Profile"
                        >
                            <div style={S.avatar}>
                                {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                            </div>
                            <span className="username-label" style={S.userName}>
                                {user?.firstName ?? "User"}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <div style={{ ...S.content, ...contentStyle }}>
                    {/* Page Content */}
                    {children}
                </div>
            </div>
        </div>
    );
}

const S = {
    shell: {
        display: "flex",
        height: "100vh",
        background: "#F5F5F5",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 40,
    },
    main: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 },

    header: {
        background: "#FFFFFF",
        padding: "0 24px",
        height: 58,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: 12,
        flexShrink: 0,
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
    headerRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },

    menuBtn: {
        display: "none",
        background: "transparent",
        border: "none",
        color: "#6B7280",
        cursor: "pointer",
        padding: "6px",
        borderRadius: 8,
        lineHeight: 0,
        flexShrink: 0,
    },

    searchWrap: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "7px 12px",
        maxWidth: 260,
        width: "100%",
    },
    searchInput: {
        background: "transparent",
        border: "none",
        outline: "none",
        fontSize: 13,
        color: "#374151",
        fontFamily: "inherit",
        flex: 1,
        minWidth: 0,
        cursor: "default",
    },
    searchHint: {
        fontSize: 11,
        color: "#9CA3AF",
        background: "#E5E7EB",
        borderRadius: 5,
        padding: "2px 6px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },

    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 9,
        border: "1px solid #E5E7EB",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    },

    userChip: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "5px 10px 5px 5px",
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
    },
    avatar: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 11,
        flexShrink: 0,
    },
    userName: {
        fontSize: 13,
        fontWeight: 600,
        color: "#374151",
    },

    content: { padding: "20px 24px", flex: 1 },

    headerTitles: {
        display: "flex",
        flexDirection: "column",
    },
    greetingTitle: {
        fontSize: "clamp(15px, 4vw, 18px)",
        fontWeight: 700,
        color: "#111111",
        margin: 0,
        letterSpacing: "-0.3px",
        lineHeight: 1.2,
    },
    greetingSub: {
        fontSize: "clamp(11px, 2.5vw, 12px)",
        color: "#6B7280",
        margin: "2px 0 0",
        lineHeight: 1.2,
    },
};

if (typeof window !== "undefined") {
    const id = "layout-fintpay-styles";
    if (!document.getElementById(id)) {
        const el = document.createElement("style");
        el.id = id;
        el.textContent = `
            @media (max-width: 768px) {
                .menu-btn { display: flex !important; align-items: center; }
            }
            @media (max-width: 520px) {
                .username-label { display: none !important; }
            }
        `;
        document.head.appendChild(el);
    }
}
