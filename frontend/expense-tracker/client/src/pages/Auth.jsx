import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/Toast";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const css = `
  html.auth-page, body.auth-page, #root.auth-page {
    height: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background: #F5F5F5 !important;
  }
  .auth-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .auth-input:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.1) !important; outline: none !important; }
  .auth-tab { transition: all 0.18s; }
  .auth-submit { transition: background 0.18s, box-shadow 0.18s; }
  .auth-submit:hover:not(:disabled) { background: #1A4731 !important; box-shadow: 0 6px 18px rgba(26,71,49,0.38) !important; }
  .auth-google { transition: box-shadow 0.15s, background 0.15s; }
  .auth-google:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; background: #f8fafb !important; }
  .auth-link:hover { color: #1A4731 !important; }
  .auth-back:hover { color: #6B7280 !important; }
  @media (max-width: 900px) {
    .auth-brand { display: none !important; }
    .auth-wrap  { grid-template-columns: 1fr !important; max-width: 460px !important; }
    .auth-mob-logo { display: flex !important; }
  }
  @media (max-width: 520px) {
    .auth-wrap { border-radius: 14px !important; }
    .auth-form  { padding: 28px 20px !important; }
  }
`;

function BrandLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111111", lineHeight: 1, letterSpacing: "-0.3px" }}>Finance Tracker</div>
        <div style={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1, marginTop: 2 }}>Smart money management</div>
      </div>
    </div>
  );
}

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const handleClick = () => { setLoading(true); window.location.href = `${API_URL}/api/auth/google`; };
  return (
    <button onClick={handleClick} disabled={loading} className="auth-google"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 44, padding: "0 16px", background: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: loading ? 0.75 : 1 }}>
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

const BRAND_FEATURES = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Natural Language Entry",
    desc: 'Type "spent 1500 on jollof rice" to log instantly',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
    title: "Auto Categorization",
    desc: "Food, transport, airtime grouped with no manual tagging",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: "Visual Analytics",
    desc: "Clear charts and spending breakdowns every month",
  },
];

export default function Auth() {
  const [tab, setTab]     = useState("login");
  const [form, setForm]   = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate    = useNavigate();
  const toast       = useToast();

  useEffect(() => {
    const root = document.getElementById("root");
    document.documentElement.classList.add("auth-page");
    document.body.classList.add("auth-page");
    root?.classList.add("auth-page");
    return () => {
      document.documentElement.classList.remove("auth-page");
      document.body.classList.remove("auth-page");
      root?.classList.remove("auth-page");
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (tab === "register") {
      if (!form.firstName || !form.lastName) return toast.error("Please enter your full name");
    }
    if (!form.email)    return toast.error("Email is required");
    if (!form.password) return toast.error("Password is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Invalid email format");

    if (tab === "register") {
      if (form.password.length < 8)            return toast.error("Password must be at least 8 characters");
      if (!/[A-Z]/.test(form.password))        return toast.error("Password must contain an uppercase letter");
      if (!/[a-z]/.test(form.password))        return toast.error("Password must contain a lowercase letter");
      if (!/\d/.test(form.password))           return toast.error("Password must contain a number");
      if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error("Password must contain a special character (e.g. @, #, !)");
    } else {
      if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    }

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
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        (err.request ? "Cannot reach the server. Is the backend running?" : "Something went wrong");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", fontSize: 14,
    border: "1.5px solid #E5E7EB", borderRadius: 10, outline: "none",
    color: "#111111", background: "#fff", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <style>{css}</style>

      <div className="auth-wrap" style={{ width: "100%", maxWidth: 1020, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 560, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        {/* ── Brand panel (left) ── */}
        <div className="auth-brand" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(160deg, #f0fdf4 0%, #e8f5e9 100%)", borderRight: "1px solid #E5E7EB" }}>
          <BrandLogo />

          <div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#111111", margin: "0 0 2px", lineHeight: 1.15, letterSpacing: "-1px" }}>
              Track smarter,
            </h1>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "#2D6A4F", margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-1px" }}>
              spend wiser.
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, margin: "0 0 28px", maxWidth: 320 }}>
              Your personal finance companion built for Nigerian students and young professionals.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BRAND_FEATURES.map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EAF5EA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111111", lineHeight: 1.2 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Built for Nigerian students and professionals</p>
        </div>

        {/* ── Form panel (right) ── */}
        <div className="auth-form" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Mobile logo */}
          <div className="auth-mob-logo" style={{ display: "none", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <BrandLogo />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111111", margin: "0 0 4px", letterSpacing: "-0.4px" }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>
            {tab === "login" ? "Sign in to manage your finances" : "Start tracking your money today"}
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
            {["login", "register"].map((t) => (
              <button key={t} className="auth-tab" onClick={() => setTab(t)}
                style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 500, background: tab === t ? "#2D6A4F" : "transparent", border: "none", borderRadius: 7, cursor: "pointer", color: tab === t ? "#fff" : "#6B7280", fontFamily: "inherit", boxShadow: tab === t ? "0 2px 8px rgba(45,106,79,0.25)" : "none" }}>
                {t === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <GoogleSignInButton />

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          {/* Name fields (register only) */}
          {tab === "register" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle} htmlFor="auth-firstName">First name</label>
                <input className="auth-input" style={inputStyle} id="auth-firstName" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="auth-lastName">Last name</label>
                <input className="auth-input" style={inputStyle} id="auth-lastName" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle} htmlFor="auth-email">Email address</label>
            <input className="auth-input" style={inputStyle} id="auth-email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={labelStyle} htmlFor="auth-password">Password</label>
            <input className="auth-input" style={inputStyle} id="auth-password" name="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} />
          </div>

          <button className="auth-submit"
            style={{ width: "100%", padding: "13px", fontSize: 14, fontWeight: 700, background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", marginTop: 16, fontFamily: "inherit", boxShadow: "0 4px 14px rgba(45,106,79,0.25)", opacity: loading ? 0.75 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", marginTop: 18, marginBottom: 0 }}>
            {tab === "login" ? "New here? " : "Already have an account? "}
            <span className="auth-link" style={{ color: "#2D6A4F", fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}
              onClick={() => setTab(tab === "login" ? "register" : "login")}>
              {tab === "login" ? "Create an account" : "Sign in instead"}
            </span>
          </p>

          <button className="auth-back"
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 12, margin: "16px auto 0", fontFamily: "inherit", padding: 0, transition: "color 0.15s" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
