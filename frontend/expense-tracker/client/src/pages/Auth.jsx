import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/Toast";

export default function Auth() {
    const [tab, setTab] = useState("login");
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { setUser } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (tab === "register") {
            if (!form.firstName || !form.lastName) return toast.error("Please enter your full name");
        }
        if (!form.email)    return toast.error("Email is required");
        if (!form.password) return toast.error("Password is required");
        if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
        if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Invalid email format");

        setLoading(true);
        try {
            const data = tab === "login" 
                ? await authService.login(form)
                : await authService.register(form);
            localStorage.setItem("token", data.token);
            setUser(data.user);
            toast.success(tab === "login" ? `Welcome back, ${data.user.firstName}!` : "Account created!");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.orb1} />
            <div style={styles.orb2} />

            <div style={styles.container} className="auth-container">
                {/* Left: Branding */}
                <div style={styles.brandPanel} className="brand-panel">
                    <div>
                        <span style={styles.logoText}>Expensify</span>
                    </div>

                    <div style={styles.brandMiddle}>
                        <h1 style={styles.headline}>
                            Track smarter,<br />
                            <span style={styles.gradientText}>spend wiser.</span>
                        </h1>
                        <p style={styles.tagline}>
                            Your AI-powered finance companion. Add transactions in plain English, get smart insights, and stay on budget effortlessly.
                        </p>

                        <div style={styles.features}>
                            {[
                                { title: "Natural Language",  desc: '"Spent 1k on lunch today"' },
                                { title: "Smart Insights",    desc: "AI analyzes your spending" },
                                { title: "Budget Tracking",   desc: "Stay within your limits" },
                            ].map(({ title, desc }) => (
                                <div key={title} style={styles.feature}>
                                    <div>
                                        <div style={styles.featureTitle}>{title}</div>
                                        <div style={styles.featureDesc}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={styles.brandFooter}>Built with intelligence in mind</p>
                </div>

                {/* Right: Form */}
                <div style={styles.formPanel} className="form-panel">
                    <div style={styles.formCard} className="form-card">
                        <div style={styles.mobileLogo} className="form-panel-mobile-logo">
                            <span style={styles.logoText}>Expensify</span>
                        </div>

                        <h2 style={styles.heading}>
                            {tab === "login" ? "Welcome back" : "Create account"}
                        </h2>
                        <p style={styles.subheading}>
                            {tab === "login" ? "Sign in to manage your finances" : "Start tracking your money today"}
                        </p>

                        <div style={styles.tabs}>
                            {["login", "register"].map((t) => (
                                <button
                                    key={t}
                                    style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
                                    onClick={() => setTab(t)}
                                >
                                    {t === "login" ? "Sign in" : "Register"}
                                </button>
                            ))}
                        </div>

                        {tab === "register" && (
                            <div style={styles.nameRow}>
                                <div style={styles.field}>
                                    <label style={styles.label}>First name</label>
                                    <input style={styles.input} name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Last name</label>
                                    <input style={styles.input} name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        <div style={styles.field}>
                            <label style={styles.label}>Email address</label>
                            <input style={styles.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Password</label>
                            <input style={styles.input} name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
                        </div>

                        <button
                            style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
                        </button>

                        <p style={styles.footer}>
                            {tab === "login" ? "New here? " : "Already have an account? "}
                            <span style={styles.link} onClick={() => setTab(tab === "login" ? "register" : "login")}>
                                {tab === "login" ? "Create an account" : "Sign in instead"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .brand-panel { display: none !important; }
          .auth-container { grid-template-columns: 1fr !important; max-width: 480px !important; }
          .form-panel-mobile-logo { display: flex !important; }
        }
      `}</style>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: "100vh",
        background: "#0f172a",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
    },
    orb1: {
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
        top: -200,
        left: -200,
        filter: "blur(60px)",
        pointerEvents: "none",
    },
    orb2: {
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
        bottom: -150,
        right: -150,
        filter: "blur(60px)",
        pointerEvents: "none",
    },
    container: {
        width: "100%",
        maxWidth: 1050,
        background: "rgba(30,41,59,0.9)",
        backdropFilter: "blur(16px)",
        border: "1px solid #334155",
        borderRadius: 24,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: 600,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        position: "relative",
        zIndex: 1,
    },
    brandPanel: {
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "rgba(99,102,241,0.05)",
        borderRight: "1px solid #334155",
    },
    logoText: { fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" },
    brandMiddle: { padding: "1.5rem 0" },
    headline: {
        fontSize: 36,
        fontWeight: 700,
        color: "#f1f5f9",
        margin: 0,
        lineHeight: 1.2,
        letterSpacing: "-1px",
    },
    gradientText: {
        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
    },
    tagline: {
        fontSize: 14,
        color: "#94a3b8",
        lineHeight: 1.6,
        margin: "1.25rem 0 2rem",
        maxWidth: 360,
    },
    features: { display: "flex", flexDirection: "column", gap: "0.75rem" },
    feature: {
        padding: "0.875rem 1rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid #334155",
        borderRadius: 12,
    },
    featureTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
    featureDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
    brandFooter: { fontSize: 12, color: "#475569", margin: 0 },

    formPanel: {
        padding: "2.5rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    formCard: { width: "100%", maxWidth: 380 },
    mobileLogo: {
        display: "none",
        alignItems: "center",
        marginBottom: "1.5rem",
        justifyContent: "center",
    },
    heading: {
        fontSize: 24,
        fontWeight: 700,
        color: "#f1f5f9",
        margin: "0 0 6px",
        letterSpacing: "-0.5px",
    },
    subheading: { fontSize: 14, color: "#64748b", margin: "0 0 1.5rem" },
    tabs: {
        display: "flex",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: 4,
        marginBottom: "1.5rem",
        gap: 4,
    },
    tab: {
        flex: 1,
        padding: "9px 0",
        fontSize: 13,
        fontWeight: 500,
        background: "transparent",
        border: "none",
        borderRadius: 7,
        cursor: "pointer",
        color: "#64748b",
        fontFamily: "inherit",
        transition: "all 0.2s",
    },
    tabActive: {
        background: "#6366f1",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
    },
    nameRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    field: { marginBottom: 14 },
    label: { display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 },
    input: {
        width: "100%",
        padding: "11px 14px",
        fontSize: 14,
        border: "1px solid #334155",
        borderRadius: 10,
        outline: "none",
        color: "#f1f5f9",
        background: "#334155",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    btnPrimary: {
        width: "100%",
        padding: "13px",
        fontSize: 14,
        fontWeight: 600,
        background: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        marginTop: 8,
        fontFamily: "inherit",
        boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
    },
    footer: { textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 20 },
    link: { color: "#818cf8", fontWeight: 500, cursor: "pointer" },
};
