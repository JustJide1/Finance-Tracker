import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────
   CSS
─────────────────────────────────────────────────────────────── */
const css = `
  html { scroll-behavior: smooth; }

  /* ── override dashboard's overflow:hidden while Landing is active ── */
  html.l-page, body.l-page, #root.l-page {
    height: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background: #fff !important;
  }
  /* re-lock body scroll when mobile menu is open */
  body.l-menu-open { overflow: hidden !important; }

  /* ── custom scrollbar ── */
  html.l-page { scrollbar-width: thin; scrollbar-color: #2D6A4F #F3F4F6; }
  html.l-page ::-webkit-scrollbar { width: 7px; }
  html.l-page ::-webkit-scrollbar-track { background: #F3F4F6; }
  html.l-page ::-webkit-scrollbar-thumb { background: #2D6A4F; border-radius: 999px; }
  html.l-page ::-webkit-scrollbar-thumb:hover { background: #1A4731; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── hover / transitions ── */
  .l-nav-link    { transition: color 0.18s; }
  .l-nav-link:hover { color: #2D6A4F !important; }
  .l-btn-login   { transition: background 0.18s, box-shadow 0.18s; }
  .l-btn-login:hover  { background: #f0fdf4 !important; box-shadow: 0 2px 8px rgba(45,106,79,0.12) !important; }
  .l-btn-primary { transition: background 0.2s, box-shadow 0.2s; }
  .l-btn-primary:hover { background: #1A4731 !important; box-shadow: 0 6px 18px rgba(26,71,49,0.38) !important; }
  .l-btn-outline { transition: background 0.18s; }
  .l-btn-outline:hover { background: #f9fafb !important; }
  .l-feature-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
  .l-feature-card:hover { transform: translateY(-4px); box-shadow: 0 10px 36px rgba(45,106,79,0.14) !important; border-color: #C8E6C2 !important; }
  .l-dash-btn   { transition: background 0.18s, color 0.18s; }
  .l-dash-btn:hover   { background: #2D6A4F !important; color: #fff !important; }
  .l-cta-btn    { transition: background 0.18s, box-shadow 0.18s; }
  .l-cta-btn:hover    { background: #e8f5e9 !important; box-shadow: 0 6px 28px rgba(0,0,0,0.25) !important; }
  .l-social { transition: background 0.18s; }
  .l-social:hover     { background: #E5E7EB !important; }
  .l-footer-link { transition: color 0.18s; }
  .l-footer-link:hover { color: #2D6A4F !important; }
  .l-mob-link { transition: color 0.15s; }
  .l-mob-link:hover { color: #2D6A4F !important; }

  /* ── hero bg animation ── */
  @keyframes heroBg {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  .l-hero-section {
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 45%, #F5F5F5 100%);
    background-size: 200% 200%;
    animation: heroBg 14s ease infinite;
  }

  /* ── hero entrance (CSS — no JS needed, always visible on load) ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .l-hi-badge  { animation: fadeUp 0.55s ease 0.05s both; }
  .l-hi-h1     { animation: fadeUp 0.55s ease 0.15s both; }
  .l-hi-sub    { animation: fadeUp 0.55s ease 0.28s both; }
  .l-hi-btns   { animation: fadeUp 0.55s ease 0.38s both; }
  .l-hi-stats  { animation: fadeUp 0.55s ease 0.5s  both; }
  .l-hi-card   { animation: fadeUp 0.65s ease 0.2s  both; }

  /* ── floating dashboard card ── */
  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-11px); }
  }
  .l-float { animation: floatCard 5.5s ease-in-out 1s infinite; }

  /* ── scroll-triggered sections ── */
  .l-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.65s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .l-animate.l-in {
    opacity: 1;
    transform: translateY(0);
  }
  .l-d1 { transition-delay: 0.06s; }
  .l-d2 { transition-delay: 0.13s; }
  .l-d3 { transition-delay: 0.20s; }
  .l-d4 { transition-delay: 0.27s; }
  .l-d5 { transition-delay: 0.34s; }
  .l-d6 { transition-delay: 0.41s; }

  /* ── mobile menu ── */
  .l-mob-menu {
    display: none;
    position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.98); backdrop-filter: blur(12px);
    z-index: 98; flex-direction: column;
    padding: 24px 24px 32px;
    overflow-y: auto;
    border-top: 1px solid #E5E7EB;
    animation: fadeUp 0.22s ease;
  }
  .l-mob-menu.open { display: flex !important; }

  /* ── step connector ── */
  .l-step-conn { flex: 0 0 48px; align-self: center; margin-top: -50px; border-top: 1.5px solid #E5E7EB; }

  /* ── breakpoints ── */
  @media (max-width: 1280px) {
    .l-hero { padding: 108px 48px 72px !important; }
  }
  @media (max-width: 1024px) {
    .l-features-grid { grid-template-columns: repeat(3, 1fr) !important; }
    .l-hero { gap: 40px !important; padding: 96px 36px 64px !important; }
    .l-hero-h1 { font-size: 44px !important; letter-spacing: -1.2px !important; }
    .l-section { padding: 72px 36px !important; }
    .l-cta-sec { padding: 64px 36px !important; }
  }
  @media (max-width: 768px) {
    .l-nav-links { display: none !important; }
    .l-nav-btns  { display: none !important; }
    .l-hamburger { display: flex !important; }
    .l-nav       { padding: 0 20px !important; }

    .l-hero        { flex-direction: column !important; padding: 88px 20px 56px !important; gap: 36px !important; }
    .l-hero-left   { max-width: 100% !important; text-align: center; align-items: center !important; display: flex; flex-direction: column; }
    .l-hero-h1     { font-size: 38px !important; letter-spacing: -1px !important; text-align: center !important; }
    .l-hero-sub    { text-align: center !important; max-width: 100% !important; }
    .l-hero-btns-r { justify-content: center !important; }
    .l-stats-row   { justify-content: center !important; gap: 24px !important; }
    .l-hero-right  { max-width: 520px !important; width: 100% !important; margin: 0 auto !important; }

    .l-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .l-section-h2    { font-size: 28px !important; letter-spacing: -0.5px !important; }

    .l-how-grid  { flex-direction: column !important; gap: 32px !important; }
    .l-step-conn { display: none !important; }

    .l-cta-sec   { padding: 64px 20px !important; }
    .l-cta-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 32px !important; }
    .l-cta-center{ align-items: center !important; max-width: 100% !important; }
    .l-cta-illus { display: none !important; }
    .l-cta-phone { display: none !important; }
    .l-cta-h2    { font-size: 28px !important; }

    .l-section   { padding: 64px 20px !important; }

    .l-footer-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 28px !important; }
    .l-footer-brand { align-items: center !important; }
    .l-footer       { padding: 40px 20px 24px !important; }
  }
  @media (max-width: 480px) {
    .l-hero        { padding: 80px 16px 48px !important; }
    .l-hero-h1     { font-size: 30px !important; }
    .l-hero-btns-r { flex-direction: column !important; width: 100% !important; }
    .l-hero-btns-r button { width: 100% !important; }
    .l-stats-row   { flex-direction: column !important; align-items: center !important; gap: 16px !important; }
    .l-dash-card   { padding: 16px !important; }
    .l-features-grid { grid-template-columns: 1fr !important; }
    .l-section     { padding: 52px 16px !important; }
    .l-section-h2  { font-size: 24px !important; }
    .l-how-grid    { gap: 24px !important; }
    .l-cta-sec     { padding: 52px 16px !important; }
    .l-cta-h2      { font-size: 24px !important; }
    .l-footer      { padding: 36px 16px 20px !important; }
    .l-footer-links{ flex-direction: column !important; align-items: center !important; gap: 14px !important; }
    .l-nav         { padding: 0 16px !important; }
    .l-mob-menu    { padding: 20px 16px 28px !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────
   SVG icons
─────────────────────────────────────────────────────────────── */
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>
);
const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const NavWalletIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Data
─────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Smart Categorization",
    desc: "Automatically groups expenses like data bundles, food, transport and school fees with no manual tagging.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3m0 0V4m0 3 3-3M4 17h3m0 0v3m0-3 3 3M17 7h3m-3 0V4m0 3-3-3M17 17h3m-3 0v3m0-3-3 3"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  },
  {
    title: "Natural Language Entry",
    desc: 'Type "spent 1500 on jollof rice" and the app logs the transaction for you instantly.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    title: "Spending Insights",
    desc: "See exactly where your money goes each month and spot habits worth changing.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  },
  {
    title: "Recurring Transactions",
    desc: "Track monthly allowances, subscriptions, rent, and any repeating payments automatically.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  },
  {
    title: "Visual Analytics",
    desc: "Clean charts and breakdowns built for how students and young professionals actually think about money.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  },
  {
    title: "Secure & Private",
    desc: "Your data is protected with JWT auth and encrypted cloud storage. No third-party access.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  },
];

const TRANSACTIONS = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
      </svg>
    ),
    name: "Jollof Rice", cat: "Food & Drinks", amount: "-₦1,500", day: "Today", income: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    ),
    name: "Data Bundle", cat: "Data & Airtime", amount: "-₦2,000", day: "Today", income: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="8 12 12 16 16 12"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
      </svg>
    ),
    name: "Monthly Allowance", cat: "Allowance", amount: "+₦25,000", day: "Yesterday", income: true,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/>
        <path d="M16 8h4l3 4v3h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    name: "Uber to School", cat: "Transport", amount: "-₦800", day: "Yesterday", income: false,
  },
];

/* ─────────────────────────────────────────────────────────────
   Shared brand logo
─────────────────────────────────────────────────────────────── */
function BrandLogo({ sm }) {
  const b = sm ? 28 : 36, r = sm ? 8 : 10, i = sm ? 14 : 20, t = sm ? 13 : 15, g = sm ? 7 : 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: g, flexShrink: 0 }}>
      <div style={{ width: b, height: b, borderRadius: r, background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <NavWalletIcon size={i} />
      </div>
      <div>
        <div style={{ fontSize: t, fontWeight: 800, color: "#111111", lineHeight: 1, letterSpacing: "-0.3px" }}>Finance Tracker</div>
        <div style={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1, marginTop: 2 }}>Smart money management</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const goToAuth  = () => { setMenuOpen(false); navigate("/auth"); };
  const closeMenu = () => setMenuOpen(false);

  /* add l-page class to html/body/#root on mount, remove on unmount */
  useEffect(() => {
    const root = document.getElementById("root");
    document.documentElement.classList.add("l-page");
    document.body.classList.add("l-page");
    root?.classList.add("l-page");
    return () => {
      document.documentElement.classList.remove("l-page");
      document.body.classList.remove("l-page");
      root?.classList.remove("l-page");
    };
  }, []);

  /* lock/unlock body scroll when mobile menu opens/closes */
  useEffect(() => {
    document.body.classList.toggle("l-menu-open", menuOpen);
    return () => document.body.classList.remove("l-menu-open");
  }, [menuOpen]);

  /* scroll-triggered fade-up for below-fold sections */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("l-in"); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".l-animate").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* smooth-scroll for nav links */
  const scrollTo = (label) => {
    const map = { Features: "features", "How It Works": "how-it-works" };
    const id = map[label];
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    closeMenu();
  };

  const NAV = ["Features", "How It Works", "About", "Pricing", "FAQ"];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#FFFFFF", color: "#111111" }}>
      <style>{css}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="l-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E5E7EB",
        height: 64, display: "flex", alignItems: "center",
        padding: "0 48px", justifyContent: "space-between",
      }}>
        <BrandLogo />

        <div className="l-nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {NAV.map((l) => (
            <span key={l} className="l-nav-link" onClick={() => scrollTo(l)}
              style={{ fontSize: 14, color: "#6B7280", cursor: "pointer", fontWeight: 500 }}>{l}</span>
          ))}
        </div>

        <div className="l-nav-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="l-btn-login" onClick={goToAuth} style={{ padding: "8px 22px", fontSize: 14, fontWeight: 500, background: "#fff", color: "#2D6A4F", border: "1.5px solid #2D6A4F", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}>Login</button>
          <button className="l-btn-primary" onClick={goToAuth} style={{ padding: "8px 22px", fontSize: 14, fontWeight: 600, background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}>Get Started</button>
        </div>

        {/* hamburger — hidden on desktop via CSS */}
        <button className="l-hamburger" onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{ display: "none", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 5, width: 40, height: 40, background: "transparent", border: "none", cursor: "pointer", borderRadius: 8, padding: 6 }}>
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
            : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="5" x2="18" y2="5"/><line x1="2" y1="10" x2="18" y2="10"/><line x1="2" y1="15" x2="18" y2="15"/></svg>
          }
        </button>
      </nav>

      {/* mobile menu */}
      <div className={`l-mob-menu${menuOpen ? " open" : ""}`}>
        {NAV.map((l) => (
          <div key={l} className="l-mob-link" onClick={() => scrollTo(l)}
            style={{ fontSize: 17, fontWeight: 600, color: "#111111", padding: "16px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>{l}</div>
        ))}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={goToAuth} style={{ padding: "14px", fontSize: 15, fontWeight: 600, background: "#fff", color: "#2D6A4F", border: "1.5px solid #2D6A4F", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>Login</button>
          <button onClick={goToAuth} style={{ padding: "14px", fontSize: 15, fontWeight: 700, background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>Get Started →</button>
        </div>
      </div>

      {/* ══════════ HERO ══════════ */}
      <section className="l-hero l-hero-section" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 60, padding: "120px 60px 80px",
        maxWidth: 1200, margin: "0 auto", minHeight: "100vh",
      }}>
        {/* Left */}
        <div className="l-hero-left" style={{ flex: 1, maxWidth: 520 }}>
          <div className="l-hi-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "#C8E6C2", color: "#1A4731",
            borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, marginBottom: 22,
          }}>
            <span>🇳🇬</span><span>Built for Nigerian Students</span>
          </div>

          <h1 className="l-hero-h1 l-hi-h1" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1, color: "#111111", margin: "0 0 2px", letterSpacing: "-1.8px" }}>
            Manage Your Money
          </h1>
          <h1 className="l-hero-h1 l-hi-h1" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1, color: "#2D6A4F", margin: "0 0 0", letterSpacing: "-1.8px" }}>
            The Nigerian Way
          </h1>

          <p className="l-hero-sub l-hi-sub" style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.75, margin: "20px 0 32px", maxWidth: 460 }}>
            Track every naira, manage budgets, and understand your spending habits. All from your phone.
          </p>

          <div className="l-hero-btns-r l-hi-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="l-btn-primary" onClick={goToAuth} style={{ padding: "14px 30px", fontSize: 15, fontWeight: 700, background: "#2D6A4F", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}>Start Tracking →</button>
            <button className="l-btn-outline" onClick={goToAuth} style={{ padding: "14px 30px", fontSize: 15, fontWeight: 500, background: "#fff", color: "#374151", border: "1.5px solid #D1D5DB", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          </div>

          <div className="l-stats-row l-hi-stats" style={{ display: "flex", gap: 28, marginTop: 44, flexWrap: "wrap" }}>
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16V4m0 0L3 8m4-4 4 4"/>
                    <path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
                  </svg>
                ),
                value: "10k+", label: "Transactions Tracked",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                ),
                value: "Smart", label: "Expense Analysis",
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                value: "24/7", label: "Insights Available",
              },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#C8E6C2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111111", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — dashboard card */}
        <div className="l-hero-right l-hi-card" style={{ flex: 1, maxWidth: 460 }}>
          <div className="l-float">
            <div className="l-dash-card" style={{ background: "#fff", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.11)", padding: 28, border: "1px solid #EDEDED" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}>Monthly Overview</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>June 2026</div>
                </div>
                <div style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>+12% ↗ vs last month</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                <div style={{ background: "rgba(45,106,79,0.07)", borderRadius: 14, padding: "14px 16px", position: "relative" }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6, fontWeight: 500 }}>Income</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#2D6A4F", lineHeight: 1 }}>₦52,000</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Total Income</div>
                  <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.7 }}><WalletIcon /></div>
                </div>
                <div style={{ background: "rgba(220,38,38,0.06)", borderRadius: 14, padding: "14px 16px", position: "relative" }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6, fontWeight: 500 }}>Expenses</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>₦18,500</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Total Expenses</div>
                  <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.7 }}><CardIcon /></div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>Recent Transactions</div>
                <span style={{ fontSize: 12, color: "#2D6A4F", cursor: "pointer", fontWeight: 600 }}>View All →</span>
              </div>

              {TRANSACTIONS.map(({ icon, name, cat, amount, day, income }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: income ? "rgba(45,106,79,0.10)" : "rgba(107,114,128,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{cat}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: income ? "#2D6A4F" : "#DC2626" }}>{amount}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{day}</div>
                  </div>
                </div>
              ))}

              <button className="l-dash-btn" onClick={goToAuth} style={{ display: "block", width: "100%", marginTop: 18, padding: "11px", background: "transparent", border: "1.5px solid #2D6A4F", borderRadius: 10, color: "#2D6A4F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                View Dashboard →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="l-section" style={{ background: "#F5F5F5", padding: "88px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="l-animate" style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 className="l-section-h2" style={{ fontSize: 36, fontWeight: 800, color: "#111111", margin: "0 0 12px", letterSpacing: "-0.8px" }}>Everything You Need</h2>
            <p style={{ fontSize: 16, color: "#6B7280" }}>Designed specifically for Nigerian students and young professionals.</p>
          </div>
          <div className="l-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} className={`l-feature-card l-animate l-d${i + 1}`}
                style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "22px 18px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EAF5EA", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111111", marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="l-section" style={{ background: "#FFFFFF", padding: "88px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="l-animate" style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="l-section-h2" style={{ fontSize: 36, fontWeight: 800, color: "#111111", margin: "0 0 12px", letterSpacing: "-0.8px" }}>How It Works</h2>
            <p style={{ fontSize: 16, color: "#6B7280" }}>Three simple steps to financial clarity.</p>
          </div>

          <div className="l-how-grid" style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            <Step className="l-animate l-d1" number="1" title="Add Transactions" body="Enter transactions manually or type in plain English, whatever feels natural."
              visual={
                <div style={{ background: "#F5F5F5", borderRadius: 12, padding: "18px 20px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2D6A4F", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151", flex: 1, fontStyle: "italic" }}>spent 1500 on jollof rice</span>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2D6A4F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              }
            />
            <div className="l-step-conn" />
            <Step className="l-animate l-d3" number="2" title="Organised Automatically" body="Every transaction is categorised and sorted with no manual labels needed."
              visual={
                <div style={{ background: "#F5F5F5", borderRadius: 12, padding: "16px 20px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#C8E6C2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#2D6A4F" }}>Food &amp; Drinks</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#111111" }}>₦1,500</div>
                  </div>
                </div>
              }
            />
            <div className="l-step-conn" />
            <Step className="l-animate l-d5" number="3" title="Receive Insights" body="Discover spending trends, flag anomalies, and find real opportunities to save."
              visual={
                <div style={{ background: "#F5F5F5", borderRadius: 12, padding: "16px 20px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 16 }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
                    <circle cx="26" cy="26" r="18" fill="none" stroke="#EAF5EA" strokeWidth="10"/>
                    <circle cx="26" cy="26" r="18" fill="none" stroke="#2D6A4F" strokeWidth="10" strokeDasharray="56 57" strokeDashoffset="14" strokeLinecap="round"/>
                    <circle cx="26" cy="26" r="18" fill="none" stroke="#A8D5A2" strokeWidth="10" strokeDasharray="28 85" strokeDashoffset="-42" strokeLinecap="round"/>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {[{ w: "75%", c: "#2D6A4F" }, { w: "50%", c: "#A8D5A2" }, { w: "85%", c: "#C8E6C2" }].map(({ w, c }, i) => (
                      <div key={i} style={{ height: 9, borderRadius: 5, background: c, width: w }} />
                    ))}
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="l-cta-sec" style={{ background: "#1A4731", padding: "80px 40px", overflow: "hidden" }}>
        <div className="l-cta-inner l-animate" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>

          <div className="l-cta-illus" style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
            <span style={{ fontSize: 96, lineHeight: 1, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}>💰</span>
            <span style={{ fontSize: 44, lineHeight: 1, marginTop: -8, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}>🪙</span>
          </div>

          <div className="l-cta-center" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, maxWidth: 520 }}>
            <h2 className="l-cta-h2" style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.18, letterSpacing: "-1px" }}>
              Take Control of Your<br />Finances Today
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", margin: 0, lineHeight: 1.7, maxWidth: 400 }}>
              Track expenses, set budgets, and gain real clarity over your money.
            </p>
            <button className="l-cta-btn" onClick={goToAuth} style={{ marginTop: 8, padding: "16px 40px", fontSize: 15, fontWeight: 700, background: "#fff", color: "#1A4731", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,0,0,0.20)" }}>
              Create Free Account →
            </button>
          </div>

          <div className="l-cta-phone" style={{ width: 195, flexShrink: 0, position: "relative", background: "rgba(255,255,255,0.07)", border: "2.5px solid rgba(255,255,255,0.18)", borderRadius: 36, padding: "28px 18px 22px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 56, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 999 }}/>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.88)", fontWeight: 600, marginBottom: 2 }}>Good morning, Adeola 👋</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>This Month ▾</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 1 }}>Balance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 14, letterSpacing: "-0.6px" }}>₦33,500</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 16 }}>
              {[{ l: "Income", v: "₦52,000", c: "#A8D5A2" }, { l: "Expenses", v: "₦18,500", c: "#FCA5A5" }].map(({ l, v, c }) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.09)", borderRadius: 9, padding: "8px 9px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Categories</div>
            {[{ cat: "Food & Drinks", pct: 45, color: "#4ADE80" }, { cat: "Transport", pct: 28, color: "#86EFAC" }, { cat: "Data & Airtime", pct: 17, color: "#BBF7D0" }].map(({ cat, pct, color }) => (
              <div key={cat} style={{ marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{cat}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="l-footer" style={{ background: "#FFFFFF", borderTop: "1px solid #E5E7EB", padding: "48px 48px 28px" }}>
        <div className="l-footer-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div className="l-footer-brand" style={{ maxWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
            <BrandLogo sm />
            <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Built for Nigerian students and young professionals.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SocialBtn title="Twitter/X">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#6B7280"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </SocialBtn>
            <SocialBtn title="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#6B7280" stroke="none"/>
              </svg>
            </SocialBtn>
            <SocialBtn title="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#6B7280"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </SocialBtn>
          </div>

          <div className="l-footer-links" style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
            {["Privacy Policy", "Terms of Service", "Contact Us"].map((l) => (
              <span key={l} className="l-footer-link" style={{ fontSize: 13, color: "#6B7280", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "24px auto 0", borderTop: "1px solid #F3F4F6", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
          © 2026 Intelligent Finance Tracker. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ─── sub-components ─── */
function Step({ number, title, body, visual, className }) {
  return (
    <div className={className} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#2D6A4F", color: "#fff", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(45,106,79,0.30)" }}>{number}</div>
      <div style={{ width: "100%" }}>{visual}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111111", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  );
}

function SocialBtn({ title, children }) {
  return (
    <div className="l-social" title={title} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {children}
    </div>
  );
}
