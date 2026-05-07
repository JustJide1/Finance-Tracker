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
        <div style={S.wrapper}>
            <div style={S.orb1} />
            <div style={S.orb2} />
            <div style={S.orb3} />

            <div style={S.container} className="auth-container">
                {/* Left: Branding */}
                <div style={S.brandPanel} className="brand-panel">
                    <div style={S.brandLogo}>
                        <span style={S.logoText}>MoneyMap</span>
                    </div>

                    <div style={S.brandMiddle}>
                        <h1 style={S.headline}>
                            Track smarter,<br />
                            <span style={S.gradientText}>spend wiser.</span>
                        </h1>
                        <p style={S.tagline}>
                            Your AI-powered finance companion. Add transactions in plain English, get smart insights, and stay on budget effortlessly.
                        </p>

                        <div style={S.features}>
                            {[
                                { title: "Natural Language",  desc: '"Spent 1k on lunch today"' },
                                { title: "Smart Insights",    desc: "AI analyzes your spending"  },
                                { title: "Budget Tracking",   desc: "Stay within your limits"    },
                            ].map(({ title, desc }) => (
                                <div key={title} style={S.feature}>
                                    <div style={S.featureTitle}>{title}</div>
                                    <div style={S.featureDesc}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={S.brandFooter}>Built with intelligence in mind</p>
                </div>

                {/* Right: Form */}
                <div style={S.formPanel} className="form-panel">
                    <div style={S.formCard} className="form-card">
                        <div style={S.mobileLogo} className="form-panel-mobile-logo">
                            <span style={S.logoText}>MoneyMap</span>
                        </div>

                        <h2 style={S.heading}>{tab === "login" ? "Welcome back" : "Create account"}</h2>
                        <p style={S.subheading}>{tab === "login" ? "Sign in to manage your finances" : "Start tracking your money today"}</p>

                        <div style={S.tabs}>
                            {["login", "register"].map((t) => (
                                <button
                                    key={t}
                                    style={{ ...S.tabBtn, ...(tab === t ? S.tabBtnActive : {}) }}
                                    onClick={() => setTab(t)}
                                >
                                    {t === "login" ? "Sign in" : "Register"}
                                </button>
                            ))}
                        </div>

                        {tab === "register" && (
                            <div style={S.nameRow}>
                                <div style={S.field}>
                                    <label style={S.label}>First name</label>
                                    <input style={S.input} name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
                                </div>
                                <div style={S.field}>
                                    <label style={S.label}>Last name</label>
                                    <input style={S.input} name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        <div style={S.field}>
                            <label style={S.label}>Email address</label>
                            <input style={S.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                        </div>
                        <div style={S.field}>
                            <label style={S.label}>Password</label>
                            <input style={S.input} name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
                        </div>

                        <button style={{ ...S.btnPrimary, opacity: loading ? 0.75 : 1 }} onClick={handleSubmit} disabled={loading}>
                            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
                        </button>

                        <p style={S.footer}>
                            {tab === "login" ? "New here? " : "Already have an account? "}
                            <span style={S.link} onClick={() => setTab(tab === "login" ? "register" : "login")}>
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

const S = {
    wrapper: {
        minHeight: "100vh",
        background: "#061912",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
    },
    orb1: {
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,106,79,0.25) 0%, transparent 70%)",
        top: -200, left: -200, filter: "blur(60px)", pointerEvents: "none",
    },
    orb2: {
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,213,162,0.12) 0%, transparent 70%)",
        bottom: -150, right: -150, filter: "blur(60px)", pointerEvents: "none",
    },
    orb3: {
        position: "absolute", width: 350, height: 350, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
        top: "40%", left: "55%", filter: "blur(50px)", pointerEvents: "none",
    },
    container: {
        width: "100%", maxWidth: 1050,
        background: "rgba(26,60,46,0.18)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, overflow: "hidden",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        minHeight: 600,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative", zIndex: 1,
    },
    brandPanel: {
        padding: "2.5rem",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "rgba(45,106,79,0.08)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
    },
    brandLogo: { display: "flex", alignItems: "center", gap: 10 },
    logoRing: {
        width: 30, height: 30, borderRadius: 8,
        background: "linear-gradient(135deg, #1A3C2E 0%, #2D6A4F 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    logoText: { fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" },
    brandMiddle: { padding: "1.5rem 0" },
    headline: { fontSize: 36, fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.2, letterSpacing: "-1px" },
    gradientText: {
        background: "linear-gradient(135deg, #A8D5A2 0%, #2D6A4F 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    },
    tagline: { fontSize: 14, color: "rgba(241,245,249,0.65)", lineHeight: 1.6, margin: "1.25rem 0 2rem", maxWidth: 360 },
    features: { display: "flex", flexDirection: "column", gap: "0.75rem" },
    feature: {
        padding: "0.875rem 1rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
    },
    featureTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
    featureDesc:  { fontSize: 12, color: "rgba(241,245,249,0.5)", marginTop: 2 },
    brandFooter:  { fontSize: 12, color: "rgba(241,245,249,0.3)", margin: 0 },

    formPanel: { padding: "2.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "center" },
    formCard: {
        width: "100%", maxWidth: 380,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18, padding: "2rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
    mobileLogo: { display: "none", alignItems: "center", gap: 10, marginBottom: "1.5rem", justifyContent: "center" },
    heading:    { fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.5px" },
    subheading: { fontSize: 14, color: "rgba(241,245,249,0.5)", margin: "0 0 1.5rem" },
    tabs: {
        display: "flex",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: 4, marginBottom: "1.5rem", gap: 4,
    },
    tabBtn: {
        flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 500,
        background: "transparent", border: "none", borderRadius: 7,
        cursor: "pointer", color: "rgba(241,245,249,0.5)", fontFamily: "inherit", transition: "all 0.2s",
    },
    tabBtnActive: { background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", color: "#fff", boxShadow: "0 2px 8px rgba(26,71,49,0.4)" },
    nameRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    field: { marginBottom: 14 },
    label: { display: "block", fontSize: 12, fontWeight: 500, color: "rgba(241,245,249,0.55)", marginBottom: 6 },
    input: {
        width: "100%", padding: "11px 14px", fontSize: 14,
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, outline: "none",
        color: "#f1f5f9", background: "rgba(255,255,255,0.08)", boxSizing: "border-box", fontFamily: "inherit",
    },
    btnPrimary: {
        width: "100%", padding: "13px", fontSize: 14, fontWeight: 600,
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
        marginTop: 8, fontFamily: "inherit",
        boxShadow: "0 4px 14px rgba(26,71,49,0.35)",
    },
    footer: { textAlign: "center", fontSize: 13, color: "rgba(241,245,249,0.4)", marginTop: 20 },
    link:   { color: "#A8D5A2", fontWeight: 500, cursor: "pointer" },
};
