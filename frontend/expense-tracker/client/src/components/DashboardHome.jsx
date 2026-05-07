import { useMemo, useState, useEffect } from "react";
import {
    LineChart, Line,
    BarChart, Bar, Cell,
    AreaChart, Area,
    XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useDashboardData } from "../hooks/useDashboardData";
import { useAI } from "../hooks/useAI";
import QuickAdd from "./QuickAdd";

/* ── Dark tooltip for all charts ─────────────────────────────────────────── */
function DarkTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#1A3C2E",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#fff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            pointerEvents: "none",
        }}>
            {label && <div style={{ opacity: 0.65, marginBottom: 4, fontSize: 11 }}>{label}</div>}
            {payload.map((p, i) => (
                <div key={i} style={{ color: "#90EE90", lineHeight: 1.6 }}>
                    {p.name}: ₦{Number(p.value).toLocaleString()}
                </div>
            ))}
        </div>
    );
}

/* ── Data builders ───────────────────────────────────────────────────────── */
function processTransactions(txns) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Setup buckets
    const ydMap = new Map();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        ydMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
            month: d.toLocaleDateString("en-US", { month: "short" }),
            income: 0, expenses: 0,
        });
    }

    const sdMap = new Map();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        sdMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
            month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
            income: 0, expenses: 0,
        });
    }

    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${prevMonthDate.getMonth()}`;
    
    let thisMonthExpenses = 0;
    let lastMonthExpenses = 0;
    let lifetimeBalanceAtStartOfMonth = 0;
    let totalComputedBalance = 0;
    const catMap = new Map();

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekDates = days.map((day, i) => {
        const d = new Date(now);
        const mondayOffset = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - mondayOffset + i);
        return d.toISOString().split("T")[0];
    });
    const weeklyAmounts = {};
    for (const d of weekDates) weeklyAmounts[d] = 0;

    const sparklineMonths = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - (7 - i), 1);
        return `${d.getFullYear()}-${d.getMonth()}`;
    });
    const sparklineAmounts = {};
    const sparklineIncomeAmounts = {};
    for (const k of sparklineMonths) {
        sparklineAmounts[k] = 0;
        sparklineIncomeAmounts[k] = 0;
    }

    // 2. Single Pass iteration
    for (const t of txns) {
        const amount = t.amount || 0;
        const type = t.type;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) continue;

        const tYear = d.getFullYear();
        const tMonth = d.getMonth();
        const tKey = `${tYear}-${tMonth}`;
        const tDateStr = t.date?.slice(0, 10);

        const yBucket = ydMap.get(tKey);
        if (yBucket) {
            if (type === "income") yBucket.income += amount;
            else yBucket.expenses += amount;
        }

        const sBucket = sdMap.get(tKey);
        if (sBucket) {
            if (type === "income") sBucket.income += amount;
            else sBucket.expenses += amount;
        }

        const diff = type === "income" ? amount : -amount;
        totalComputedBalance += diff;
        const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        if (d < startOfCurrentMonth) {
            lifetimeBalanceAtStartOfMonth += diff;
        }

        if (type === "expense") {
            if (tKey === currentMonthKey) {
                thisMonthExpenses += amount;
                const cat = t.category || "Other";
                catMap.set(cat, (catMap.get(cat) || 0) + amount);
            } else if (tKey === prevMonthKey) {
                lastMonthExpenses += amount;
            }

            if (sparklineAmounts[tKey] !== undefined) {
                sparklineAmounts[tKey] += amount;
            }
        } else if (type === "income") {
            if (sparklineIncomeAmounts[tKey] !== undefined) {
                sparklineIncomeAmounts[tKey] += amount;
            }
        }

        if (tDateStr && weeklyAmounts[tDateStr] !== undefined) {
             weeklyAmounts[tDateStr] += amount;
        }
    }

    // 3. Final Formatting
    const yd = [...ydMap.values()];
    const sd = [...sdMap.values()];
    
    const cd = [...catMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat, amount]) => ({ cat: cat.length > 9 ? cat.slice(0, 8) + "…" : cat, amount }));

    const wd = days.map((day, i) => ({
        day,
        total: weeklyAmounts[weekDates[i]]
    }));

    const sl = sparklineMonths.map(k => ({ v: sparklineAmounts[k] }));
    const slInc = sparklineMonths.map(k => ({ v: sparklineIncomeAmounts[k] }));

    const pct = lastMonthExpenses === 0 ? null : +((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1);
    const balancePct = lifetimeBalanceAtStartOfMonth === 0 ? null : +((totalComputedBalance - lifetimeBalanceAtStartOfMonth) / Math.abs(lifetimeBalanceAtStartOfMonth) * 100).toFixed(1);

    return { yd, sd, cd, wd, sl, slInc, pct, balancePct };
}



/* ── Tiny icon helpers ───────────────────────────────────────────────────── */
function ChevronDown() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" style={{ marginLeft: 3 }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
function CalIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" style={{ marginRight: 3 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function DashboardHome() {
    const { stats, transactions, recentTransactions, loading, fetchData } = useDashboardData();
    const { getInsights } = useAI();
    const [insightsData, setInsightsData] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchAi = async () => {
            setLoadingInsights(true);
            const data = await getInsights();
            if (mounted) {
                setInsightsData(data);
                setLoadingInsights(false);
            }
        };
        if (!loading) fetchAi();
        return () => { mounted = false; };
    }, [loading]);

    const hasData = transactions.length > 0;

    const { yd, sd, cd, wd, sl, slInc, pct, balancePct } = useMemo(() => processTransactions(transactions), [transactions]);

    const balance         = stats?.balance         ?? 0;
    const totalExpenses   = stats?.totalExpenses   ?? 0;
    const totalIncome     = stats?.totalIncome     ?? 0;
    const monthlyExpenses = stats?.monthlyExpenses ?? 0;
    const maxCat          = cd.length ? Math.max(...cd.map(d => d.amount)) : 1;

    const weeklyActivityTotal = wd.reduce((sum, item) => sum + item.total, 0);
    const activityStatText = (() => {
        if (weeklyActivityTotal === 0) return "0";
        if (weeklyActivityTotal >= 1000000) return `${(weeklyActivityTotal / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
        if (weeklyActivityTotal >= 1000) return `${(weeklyActivityTotal / 1000).toFixed(1).replace(/\.0$/, '')}k`;
        return `${weeklyActivityTotal}`;
    })();

    if (loading) {
        return (
            <div style={S.wrapper}>
                <div style={S.row1}>
                    <div style={{ ...S.card, height: 280, background: "linear-gradient(140deg,#1A3C2E,#2D6A4F)" }} />
                    <div style={{ ...S.card, height: 280, background: "linear-gradient(140deg,#1E3A8A,#2563EB)" }} />
                    <div style={{ ...S.card, height: 280, background: "linear-gradient(140deg,#7F1D1D,#B91C1C)" }} />
                    <div style={{ ...S.card, height: 280 }} />
                </div>
                <div style={S.row2}>
                    {[0, 1, 2].map(i => <div key={i} style={{ ...S.card, height: 240 }} />)}
                </div>
            </div>
        );
    }

    return (
        <div style={S.wrapper}>

            {/* ── Quick Add (AI Parser) ── */}
            <QuickAdd onSuccess={fetchData} />

            {/* ── Row 1 ── */}
            <div style={S.row1} className="ft-row1">

                {/* Hero card */}
                <div style={S.heroCard}>
                    <p style={S.heroLabel}>Available Balance</p>
                    <p style={S.heroAmount}>₦{balance.toLocaleString()}</p>

                    {balancePct !== null && (
                        <div style={{ ...S.heroBadge, background: balancePct >= 0 ? "#4CAF50" : "#DC2626" }}>
                            {balancePct >= 0 ? "+" : ""}{balancePct}% vs last month
                        </div>
                    )}



                    {/* Sparkline pushed to bottom */}
                    <div style={S.heroChartWrap}>
                        <ResponsiveContainer width="100%" height={68}>
                            <AreaChart data={sl} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="slGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#90EE90" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#90EE90" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone" dataKey="v"
                                    stroke="#90EE90" strokeWidth={2}
                                    fill="url(#slGrad)" dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Income card */}
                <div style={{ ...S.heroCard, background: "linear-gradient(140deg, #1E3A8A 0%, #2563EB 100%)", boxShadow: "0 8px 28px rgba(37,99,235,0.2)" }}>
                    <p style={S.heroLabel}>Total Income</p>
                    <p style={S.heroAmount}>₦{totalIncome.toLocaleString()}</p>

                    {/* Sparkline pushed to bottom */}
                    <div style={S.heroChartWrap}>
                        <ResponsiveContainer width="100%" height={68}>
                            <AreaChart data={slInc} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="slGradInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#93C5FD" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#93C5FD" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone" dataKey="v"
                                    stroke="#93C5FD" strokeWidth={2}
                                    fill="url(#slGradInc)" dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense card */}
                <div style={{ ...S.heroCard, background: "linear-gradient(140deg, #7F1D1D 0%, #B91C1C 100%)", boxShadow: "0 8px 28px rgba(185,28,28,0.2)" }}>
                    <p style={S.heroLabel}>Total Expenses</p>
                    <p style={S.heroAmount}>₦{totalExpenses.toLocaleString()}</p>

                    {pct !== null && (
                        <div style={{ ...S.heroBadge, background: pct > 0 ? "#DC2626" : "#4CAF50" }}>
                            {pct >= 0 ? "+" : ""}{pct}% vs last month
                        </div>
                    )}

                    {/* Sparkline pushed to bottom */}
                    <div style={S.heroChartWrap}>
                        <ResponsiveContainer width="100%" height={68}>
                            <AreaChart data={sl} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="slGradExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#FCA5A5" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#FCA5A5" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone" dataKey="v"
                                    stroke="#FCA5A5" strokeWidth={2}
                                    fill="url(#slGradExp)" dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue line chart */}
                <div style={S.card}>
                    <div style={S.cardHead}>
                        <span style={S.cardTitle}>Monthly Overview</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={yd} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                                axisLine={false} tickLine={false} width={52}
                            />
                            <Tooltip content={<DarkTooltip />} />
                            <Line type="monotone" dataKey="income"   stroke="#A8D5A2" strokeWidth={2.5} dot={false} name="Income"   />
                            <Line type="monotone" dataKey="expenses" stroke="#2D6A4F" strokeWidth={2}   dot={false} name="Expenses" strokeDasharray="5 3" />
                        </LineChart>
                    </ResponsiveContainer>
                    <div style={S.legend}>
                        <span style={{ ...S.dot, background: "#A8D5A2" }} />
                        <span style={S.legTxt}>Income</span>
                        <span style={{ ...S.dot, background: "#2D6A4F", marginLeft: 12 }} />
                        <span style={S.legTxt}>Expenses</span>
                    </div>
                </div>
            </div>

            {/* ── Row 2 ── */}
            <div style={S.row2} className="ft-row2">

                {/* Recent summary bar chart */}
                <div style={S.card}>
                    <div style={S.cardHead}>
                        <span style={S.cardTitle}>Recent Summary</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={sd} barGap={2} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                                tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                                axisLine={false} tickLine={false} width={44}
                            />
                            <Tooltip content={<DarkTooltip />} />
                            <Bar dataKey="income"   fill="#1A3C2E" radius={[4, 4, 0, 0]} name="Income"   maxBarSize={14} />
                            <Bar dataKey="expenses" fill="#A8D5A2" radius={[4, 4, 0, 0]} name="Expenses" maxBarSize={14} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* AI Insights */}
                <div style={S.card}>
                    <div style={S.cardHead}>
                        <span style={S.cardTitle}>AI Insights</span>
                    </div>
                    <div style={{ height: 180, overflowY: "auto", paddingRight: 4 }} className="thin-scroll">
                        {loadingInsights ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "100%", animation: "shimmer 1.5s infinite" }} />
                                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "80%", animation: "shimmer 1.5s infinite" }} />
                                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "90%", animation: "shimmer 1.5s infinite" }} />
                                <div style={{ height: 14, background: "#F3F4F6", borderRadius: 4, width: "60%", animation: "shimmer 1.5s infinite" }} />
                            </div>
                        ) : insightsData && (insightsData.insights?.length > 0 || insightsData.anomaly) ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {insightsData.anomaly && (
                                    <div style={{ padding: "8px 12px", background: "rgba(217,119,6,0.1)", borderLeft: "3px solid #D97706", borderRadius: 4, fontSize: 12, color: "#92400E" }}>
                                        <strong>Anomaly Detected:</strong> {insightsData.anomaly}
                                    </div>
                                )}
                                {insightsData.insights?.map((insight, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 8, fontSize: 13, color: "#374151" }}>
                                        <span style={{ color: "#2D6A4F", flexShrink: 0, marginTop: 1 }}>✦</span>
                                        <span style={{ lineHeight: 1.5 }}>{insight}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 40 }}>
                                Not enough data for AI insights yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* Activity area chart */}
                <div style={S.card}>
                    <div style={S.cardHead}>
                        <div>
                            <div style={S.activityStat}>{activityStatText}</div>
                            <span style={S.cardTitle}>Activity</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={148}>
                        <AreaChart data={wd} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#A8D5A2" stopOpacity={0.45} />
                                    <stop offset="95%" stopColor="#A8D5A2" stopOpacity={0}    />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<DarkTooltip />} />
                            <Area
                                type="monotone" dataKey="total"
                                stroke="#A8D5A2" strokeWidth={2}
                                fill="url(#actGrad)" dot={false} name="Daily"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Recent Transactions ── */}
            <div style={S.card}>
                <div style={S.cardHead}>
                    <span style={S.cardTitle}>Recent Transactions</span>
                    <button style={S.refreshBtn} onClick={fetchData}>Refresh</button>
                </div>
                {recentTransactions.length === 0 ? (
                    <p style={S.empty}>No transactions yet. Add income or expenses to get started.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    {["Description", "Category", "Date", "Amount"].map(h => (
                                        <th key={h} style={S.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map(t => (
                                    <tr key={t._id} style={S.tr}>
                                        <td style={S.td}>{t.description}</td>
                                        <td style={S.td}>{t.category}</td>
                                        <td style={S.td}>{new Date(t.date).toLocaleDateString()}</td>
                                        <td style={{
                                            ...S.td,
                                            color: t.type === "expense" ? "#DC2626" : "#2D6A4F",
                                            fontWeight: 600,
                                        }}>
                                            {t.type === "expense" ? "-" : "+"}₦{t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = {
    wrapper: { display: "flex", flexDirection: "column", gap: 14 },

    row1: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 14 },
    row2: { display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr", gap: 14 },

    card: {
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "18px 20px 14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s",
    },

    cardHead: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        gap: 8,
        flexWrap: "wrap",
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: 600,
        color: "#6B7280",
        letterSpacing: "0.01em",
    },

    dropRow: { display: "flex", gap: 6 },
    dropBtn: {
        display: "flex",
        alignItems: "center",
        fontSize: 11.5,
        fontWeight: 500,
        color: "#374151",
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 7,
        padding: "4px 9px",
        cursor: "pointer",
        fontFamily: "inherit",
        gap: 2,
    },

    legend: { display: "flex", alignItems: "center", gap: 4, marginTop: 10 },
    dot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
    legTxt: { fontSize: 11, color: "#9CA3AF" },

    activityStat: {
        fontSize: 24,
        fontWeight: 800,
        color: "#111111",
        letterSpacing: "-0.5px",
        lineHeight: 1.1,
        marginBottom: 2,
    },

    /* Hero card */
    heroCard: {
        background: "linear-gradient(140deg, #1A3C2E 0%, #2D6A4F 100%)",
        borderRadius: 14,
        padding: "22px 22px 0",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "hidden",
        boxShadow: "0 8px 28px rgba(26,60,46,0.32)",
        position: "relative",
        minHeight: 256,
    },
    heroLabel: {
        fontSize: 13,
        fontWeight: 500,
        color: "rgba(255,255,255,0.7)",
        margin: 0,
    },
    heroAmount: {
        fontSize: 30,
        fontWeight: 800,
        color: "#FFFFFF",
        margin: 0,
        letterSpacing: "-0.5px",
        lineHeight: 1.2,
    },
    heroBadge: {
        display: "inline-flex",
        alignItems: "center",
        background: "#4CAF50",
        color: "#fff",
        fontSize: 11.5,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
        width: "fit-content",
    },
    heroSub: {
        fontSize: 11.5,
        color: "rgba(255,255,255,0.55)",
        margin: 0,
    },
    heroChartWrap: {
        marginTop: "auto",
        marginLeft: -22,
        marginRight: -22,
    },

    refreshBtn: {
        fontSize: 12,
        fontWeight: 600,
        color: "#2D6A4F",
        background: "rgba(45,106,79,0.08)",
        padding: "6px 12px",
        borderRadius: 8,
        border: "1px solid rgba(45,106,79,0.2)",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    empty: { fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "2rem 0" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 480 },
    th: {
        padding: "10px 16px",
        fontSize: 10.5,
        fontWeight: 600,
        color: "#6B7280",
        textAlign: "left",
        background: "#F9FAFB",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
    },
    tr: { borderTop: "1px solid #F3F4F6" },
    td: { padding: "11px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" },
};

/* ── Responsive grid breakpoints ─────────────────────────────────────────── */
if (typeof window !== "undefined") {
    const id = "dashboard-fintpay-styles";
    if (!document.getElementById(id)) {
        const el = document.createElement("style");
        el.id = id;
        el.textContent = `
            @media (max-width: 1040px) {
                .ft-row1 { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 860px) {
                .ft-row2 { grid-template-columns: 1fr 1fr !important; }
            }
            @media (max-width: 560px) {
                .ft-row2 { grid-template-columns: 1fr !important; }
            }
        `;
        document.head.appendChild(el);
    }
}
