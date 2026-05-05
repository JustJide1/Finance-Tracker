import { useNavigate, useLocation } from 'react-router-dom';

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const I = {
    overview:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    balance:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    transactions: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    categories:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    schedule:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    payees:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    payments:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    invoices:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    dataReport:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    settings:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logout:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

/* ── Nav item definitions ─────────────────────────────────────────────────── */
const MAIN_NAV = [
    { id: "overview",     label: "Dashboard",    icon: I.overview,     tab: "dashboard"  },
    { id: "balance",      label: "Income",       icon: I.balance,      tab: "income"     },
    { id: "transactions", label: "Expense",       icon: I.transactions, tab: "expenses"   },
    { id: "budgets",      label: "Budgets",      icon: I.categories,   route: "/budgets" },
    { id: "recurring",    label: "Recurring Transactions", icon: I.schedule, route: "/recurring" },
];

const BOTTOM_NAV = [
    { id: "settings",   label: "Settings",    icon: I.settings,   route: "/profile"  },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, onClose }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleNavClick = (item) => {
        if (item.route) {
            navigate(item.route);
        } else if (item.tab) {
            if (pathname !== "/dashboard") navigate("/dashboard");
            setActiveTab(item.tab);
        }
        onClose?.();
    };

    const isActive = (item) =>
        item.tab ? activeTab === item.tab : pathname === item.route;

    return (
        <aside
            style={{ ...S.sidebar, ...(isOpen ? S.sidebarOpen : {}) }}
            className={`sidebar${isOpen ? " sidebar-open" : ""}`}
        >
            {/* Brand */}
            <div style={S.brand}>
                <div style={S.logoRing}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                </div>
                <span style={S.brandText}>FinTrack</span>
                <button className="sidebar-close-btn" style={S.closeBtn} onClick={onClose}>✕</button>
            </div>

            {/* Main nav */}
            <p style={S.sectionLabel}>MAIN</p>
            <nav style={S.nav}>
                {MAIN_NAV.map((item) => (
                    <button
                        key={item.id}
                        style={{ ...S.navBtn, ...(isActive(item) ? S.navBtnActive : {}) }}
                        onClick={() => handleNavClick(item)}
                    >
                        <span style={{ ...S.navIcon, ...(isActive(item) ? S.navIconActive : {}) }}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Bottom nav */}
            <div style={S.bottomSection}>
                {BOTTOM_NAV.map((item) => (
                    <button
                        key={item.id}
                        style={{ ...S.navBtn, ...(isActive(item) ? S.navBtnActive : {}) }}
                        onClick={() => handleNavClick(item)}
                    >
                        <span style={{ ...S.navIcon, ...(isActive(item) ? S.navIconActive : {}) }}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
                <button style={S.logoutBtn} onClick={onLogout}>
                    <span style={S.navIcon}>{I.logout}</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}

const S = {
    sidebar: {
        width: 220,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px 16px",
        gap: 0,
        flexShrink: 0,
        position: "relative",
        transition: "transform 0.3s ease",
        overflowY: "auto",
    },
    sidebarOpen: { transform: "translateX(0)" },

    brand: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 24,
        padding: "0 4px",
    },
    logoRing: {
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "linear-gradient(135deg, #1A3C2E 0%, #2D6A4F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    brandText: {
        fontSize: 16,
        fontWeight: 700,
        color: "#111111",
        letterSpacing: "-0.3px",
    },
    closeBtn: {
        display: "none",
        background: "transparent",
        border: "none",
        color: "#6B7280",
        fontSize: 16,
        cursor: "pointer",
        padding: "2px 4px",
        lineHeight: 1,
    },

    sectionLabel: {
        fontSize: 10,
        fontWeight: 600,
        color: "#9CA3AF",
        letterSpacing: "0.1em",
        padding: "0 8px",
        marginBottom: 6,
    },
    nav: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        flex: 1,
    },
    navBtn: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 9,
        border: "none",
        borderLeft: "3px solid transparent",
        background: "transparent",
        color: "#6B7280",
        fontSize: 13.5,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        fontFamily: "'Inter', system-ui, sans-serif",
        whiteSpace: "nowrap",
    },
    navBtnActive: {
        background: "rgba(45,106,79,0.08)",
        color: "#1A4731",
        borderLeft: "3px solid #2D6A4F",
        paddingLeft: 7,
    },
    navIcon: {
        display: "flex",
        alignItems: "center",
        color: "#9CA3AF",
        flexShrink: 0,
    },
    navIconActive: {
        color: "#2D6A4F",
    },

    bottomSection: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        paddingTop: 12,
        borderTop: "1px solid #F3F4F6",
        marginTop: 8,
    },
    logoutBtn: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 9,
        border: "none",
        borderLeft: "3px solid transparent",
        background: "transparent",
        color: "#DC2626",
        fontSize: 13.5,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'Inter', system-ui, sans-serif",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
    },
};

if (typeof window !== "undefined") {
    const id = "sidebar-fintpay-styles";
    if (!document.getElementById(id)) {
        const el = document.createElement("style");
        el.id = id;
        el.textContent = `
            @media (max-width: 768px) {
                aside.sidebar {
                    position: fixed !important;
                    left: 0 !important; top: 0 !important; bottom: 0 !important;
                    height: 100vh !important;
                    z-index: 50 !important;
                    transform: translateX(-100%) !important;
                }
                aside.sidebar.sidebar-open { transform: translateX(0) !important; }
                .sidebar-close-btn { display: flex !important; align-items: center; }
            }
            .sidebar-navbtn:hover { background: rgba(45,106,79,0.06) !important; }
        `;
        document.head.appendChild(el);
    }
}
