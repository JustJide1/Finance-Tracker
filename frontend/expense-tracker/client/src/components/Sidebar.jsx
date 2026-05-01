import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "income",    label: "Income" },
    { id: "expenses",  label: "Expenses" },
    { id: "budgets",   label: "Budgets" },
    { id: "profile",   label: "Profile" },
    { id: "recurring", label: "Recurring Transactions" },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, onClose }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleNavClick = (id) => {
        if (id === "profile") {
            navigate("/profile");
        } else if (id === "budgets") {
            navigate("/budgets");
        } else if (id === "recurring") {
            navigate("/recurring");
        } else {
            if (pathname !== "/dashboard") navigate("/dashboard");
            setActiveTab(id);
        }
    };

    return (
        <aside style={{ ...styles.sidebar, ...(isOpen ? styles.sidebarOpen : {}) }} className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
            <div style={styles.brand}>
                <span style={styles.brandText}>Expensify</span>
                <button className="sidebar-close-btn" style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            <div style={styles.sectionLabel}>GENERAL</div>
            <nav style={styles.nav}>
                {navItems.map(({ id, label }) => (
                    <button
                        key={id}
                        style={{ ...styles.navBtn, ...(activeTab === id ? styles.navBtnActive : {}) }}
                        onClick={() => handleNavClick(id)}
                    >
                        {label}
                    </button>
                ))}
            </nav>
            <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </aside>
    );
}

const styles = {
    sidebar: {
        width: 240,
        background: "#1e293b",
        borderRight: "1px solid #334155",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        gap: 4,
        flexShrink: 0,
        position: "relative",
        transition: "transform 0.3s ease",
    },
    sidebarOpen: { transform: "translateX(0)" },
    brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem", padding: "0 0.5rem", position: "relative" },
    brandText: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" },
    closeBtn: { display: "none", marginLeft: "auto", background: "transparent", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: "0.25rem", lineHeight: 1 },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", padding: "0 0.75rem", marginBottom: 6 },
    nav: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
    navBtn: {
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
    },
    navBtnActive: { background: "rgba(99,102,241,0.12)", color: "#818cf8", borderLeft: "3px solid #6366f1", paddingLeft: 11 },
    logoutBtn: {
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: "#f43f5e",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
    },
};

if (typeof window !== 'undefined') {
    const styleId = 'sidebar-mobile-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @media (max-width: 768px) {
                aside.sidebar { position: fixed !important; left: 0 !important; top: 0 !important; bottom: 0 !important; height: 100vh !important; z-index: 50 !important; transform: translateX(-100%) !important; }
                aside.sidebar.sidebar-open { transform: translateX(0) !important; }
                .sidebar-close-btn { display: flex !important; align-items: center; justify-content: center; }
            }
        `;
        document.head.appendChild(style);
    }
}
