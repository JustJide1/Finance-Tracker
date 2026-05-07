import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import PageLayout from "../components/PageLayout";
import { reportService } from "../api/reportService";
import { useToast } from "../components/Toast";

const fmt = (n) =>
    `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Reports() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        reportService.getAnnualReport(year)
            .then((data) => { if (!cancelled) setReport(data); })
            .catch(() => { if (!cancelled) toast.error("Failed to load report."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [year]);

    const exportCSV = () => {
        if (!report) return;
        const { summary, monthly, topCategories } = report;

        const rows = [
            { Section: "SUMMARY", Label: "Total Income",       Value: summary.totalIncome       },
            { Section: "SUMMARY", Label: "Total Expenses",     Value: summary.totalExpenses     },
            { Section: "SUMMARY", Label: "Net Savings",        Value: summary.netSavings        },
            { Section: "SUMMARY", Label: "Savings Rate (%)",   Value: summary.savingsRate       },
            { Section: "SUMMARY", Label: "Total Transactions", Value: summary.totalTransactions },
            ...monthly.map((m) => ({
                Section:      "MONTHLY",
                Label:        m.monthName,
                Income:       m.income,
                Expenses:     m.expenses,
                Net:          m.net,
                Transactions: m.count,
            })),
            ...topCategories.map((c) => ({
                Section:      "CATEGORIES",
                Label:        c.category,
                "Total Spent": c.amount,
            })),
        ];

        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moneymap_annual_report_${year}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        if (!report) return;
        const { summary, monthly, topCategories } = report;
        const maxCat = topCategories[0]?.amount || 1;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Annual Report ${year} — MoneyMap</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;background:#fff}
  h1{font-size:22px;font-weight:700;margin:0 0 4px}
  .sub{color:#6B7280;font-size:13px;margin:0 0 28px}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
  .card{border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px}
  .clabel{font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
  .cval{font-size:20px;font-weight:700}
  .green{color:#2D6A4F}.red{color:#DC2626}.amber{color:#D97706}
  h2{font-size:15px;font-weight:700;margin:0 0 12px;border-bottom:1px solid #E5E7EB;padding-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px}
  th{text-align:left;padding:8px 10px;background:#F9FAFB;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #E5E7EB}
  td{padding:9px 10px;border-bottom:1px solid #F3F4F6}
  .cat-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
  .cat-name{width:160px;font-size:13px;font-weight:500;flex-shrink:0}
  .bar-bg{flex:1;background:#F3F4F6;border-radius:4px;height:8px}
  .bar{background:#2D6A4F;border-radius:4px;height:8px}
  .cat-amt{width:110px;text-align:right;font-size:13px;font-weight:600;flex-shrink:0}
  .footer{margin-top:32px;font-size:11px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:12px}
  @media print{@page{margin:20mm}}
</style></head><body>
<h1>Annual Financial Report — ${year}</h1>
<p class="sub">Generated ${new Date().toLocaleDateString("en-NG",{dateStyle:"long"})} &bull; MoneyMap</p>
<div class="cards">
  <div class="card"><div class="clabel">Total Income</div><div class="cval green">${fmt(summary.totalIncome)}</div></div>
  <div class="card"><div class="clabel">Total Expenses</div><div class="cval red">${fmt(summary.totalExpenses)}</div></div>
  <div class="card"><div class="clabel">Net Savings</div><div class="cval ${summary.netSavings >= 0 ? "green" : "red"}">${fmt(summary.netSavings)}</div></div>
  <div class="card"><div class="clabel">Savings Rate</div><div class="cval ${summary.savingsRate >= 20 ? "green" : summary.savingsRate >= 0 ? "amber" : "red"}">${summary.savingsRate}%</div></div>
  <div class="card"><div class="clabel">Transactions</div><div class="cval">${summary.totalTransactions}</div></div>
</div>
<h2>Monthly Breakdown</h2>
<table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th><th>Count</th></tr></thead><tbody>
${monthly.map((m) => `<tr style="${m.count===0?"opacity:.4":""}">
  <td>${m.monthName}</td>
  <td class="green" style="font-weight:600">${fmt(m.income)}</td>
  <td class="red" style="font-weight:600">${fmt(m.expenses)}</td>
  <td class="${m.net>=0?"green":"red"}" style="font-weight:700">${fmt(m.net)}</td>
  <td style="color:#6B7280">${m.count}</td>
</tr>`).join("")}
</tbody></table>
${topCategories.length > 0 ? `<h2>Top Expense Categories</h2>
${topCategories.map((c) => `<div class="cat-row">
  <div class="cat-name">${c.category}</div>
  <div class="bar-bg"><div class="bar" style="width:${Math.round((c.amount/maxCat)*100)}%"></div></div>
  <div class="cat-amt">${fmt(c.amount)}</div>
</div>`).join("")}` : ""}
<div class="footer">MoneyMap Annual Report &bull; ${year} &bull; All amounts in Nigerian Naira (&#8358;)</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

        const w = window.open("", "_blank");
        w.document.write(html);
        w.document.close();
    };

    const chartData = report?.monthly.map((m) => ({
        name: m.monthName.slice(0, 3),
        Income: m.income,
        Expenses: m.expenses,
    }));

    const maxCatAmount = report?.topCategories[0]?.amount || 1;

    const ExportButtons = (
        <div style={{ display: "flex", gap: 8 }}>
            <button
                style={{ ...S.exportBtn, opacity: report ? 1 : 0.5 }}
                onClick={exportCSV}
                disabled={!report}
            >
                <DownloadIcon />
                CSV
            </button>
            <button
                style={{ ...S.exportBtnAlt, opacity: report ? 1 : 0.5 }}
                onClick={exportPDF}
                disabled={!report}
            >
                <FileIcon />
                PDF
            </button>
        </div>
    );

    return (
        <PageLayout
            activeTab="reports"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); }}
            title="Annual Reports"
            subtitle="Year-over-year financial insights"
            contentStyle={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            headerRight={ExportButtons}
        >
            {/* Year selector */}
            <div style={S.yearRow}>
                <button style={S.yearBtn} onClick={() => setYear((y) => y - 1)}>
                    <ChevronLeft />
                </button>
                <span style={S.yearLabel}>{year}</span>
                <button
                    style={{ ...S.yearBtn, opacity: year >= new Date().getFullYear() ? 0.3 : 1 }}
                    onClick={() => setYear((y) => y + 1)}
                    disabled={year >= new Date().getFullYear()}
                >
                    <ChevronRight />
                </button>
            </div>

            {loading && <div style={S.empty}>Loading report…</div>}

            {!loading && report && (
                <>
                    {/* Summary cards */}
                    <div style={S.cardsGrid}>
                        <SummaryCard label="Total Income"    value={fmt(report.summary.totalIncome)}    color="#2D6A4F" />
                        <SummaryCard label="Total Expenses"  value={fmt(report.summary.totalExpenses)}  color="#DC2626" />
                        <SummaryCard
                            label="Net Savings"
                            value={fmt(report.summary.netSavings)}
                            color={report.summary.netSavings >= 0 ? "#2D6A4F" : "#DC2626"}
                        />
                        <SummaryCard
                            label="Savings Rate"
                            value={`${report.summary.savingsRate}%`}
                            color={
                                report.summary.savingsRate >= 20 ? "#2D6A4F"
                                : report.summary.savingsRate >= 0 ? "#D97706"
                                : "#DC2626"
                            }
                        />
                        <SummaryCard label="Transactions" value={report.summary.totalTransactions.toLocaleString()} color="#374151" />
                    </div>

                    {/* Monthly bar chart */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Monthly Overview</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value) => [fmt(value), ""]}
                                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Income"   fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Monthly table */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Monthly Breakdown</h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        {["Month", "Income", "Expenses", "Net", "Transactions"].map((h) => (
                                            <th key={h} style={S.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.monthly.map((m) => (
                                        <tr key={m.month} style={m.count === 0 ? { opacity: 0.35 } : {}}>
                                            <td style={S.td}>{m.monthName}</td>
                                            <td style={{ ...S.td, color: "#2D6A4F", fontWeight: 600 }}>{fmt(m.income)}</td>
                                            <td style={{ ...S.td, color: "#DC2626", fontWeight: 600 }}>{fmt(m.expenses)}</td>
                                            <td style={{ ...S.td, color: m.net >= 0 ? "#2D6A4F" : "#DC2626", fontWeight: 700 }}>
                                                {fmt(m.net)}
                                            </td>
                                            <td style={{ ...S.td, color: "#6B7280" }}>{m.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top categories */}
                    {report.topCategories.length > 0 && (
                        <div style={S.card}>
                            <h3 style={S.cardTitle}>Top Expense Categories</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {report.topCategories.map((c) => (
                                    <div key={c.category} style={S.catRow}>
                                        <span style={S.catName}>{c.category}</span>
                                        <div style={S.catBarBg}>
                                            <div
                                                style={{
                                                    ...S.catBar,
                                                    width: `${Math.round((c.amount / maxCatAmount) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span style={S.catAmt}>{fmt(c.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && report && report.summary.totalTransactions === 0 && (
                <div style={S.empty}>No transactions found for {year}.</div>
            )}
        </PageLayout>
    );
}

function SummaryCard({ label, value, color }) {
    return (
        <div style={S.summaryCard}>
            <div style={S.summaryLabel}>{label}</div>
            <div style={{ ...S.summaryValue, color }}>{value}</div>
        </div>
    );
}

const DownloadIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const FileIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
);

const ChevronLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
    </svg>
);

const S = {
    yearRow: { display: "flex", alignItems: "center", gap: 12 },
    yearBtn: {
        width: 32, height: 32, borderRadius: 8,
        border: "1px solid #E5E7EB", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#374151",
    },
    yearLabel: { fontSize: 18, fontWeight: 700, color: "#111", minWidth: 56, textAlign: "center" },

    cardsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
    },
    summaryCard: {
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 12, padding: "16px 18px",
    },
    summaryLabel: {
        fontSize: 11, fontWeight: 600, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
    },
    summaryValue: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" },

    card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px" },
    cardTitle: { fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 16px" },

    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: {
        textAlign: "left", padding: "8px 12px",
        background: "#F9FAFB", fontSize: 11, fontWeight: 600,
        color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em",
        borderBottom: "1px solid #E5E7EB",
    },
    td: { padding: "10px 12px", borderBottom: "1px solid #F3F4F6", color: "#374151", fontSize: 13 },

    catRow: { display: "flex", alignItems: "center", gap: 12 },
    catName: { fontSize: 13, fontWeight: 500, color: "#374151", width: 150, flexShrink: 0 },
    catBarBg: { flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, overflow: "hidden" },
    catBar: { background: "#2D6A4F", height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
    catAmt: { fontSize: 13, fontWeight: 600, color: "#374151", width: 110, textAlign: "right", flexShrink: 0 },

    empty: { textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: "40px 0" },

    exportBtn: {
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", fontSize: 13, fontWeight: 600,
        background: "rgba(45,106,79,0.08)", color: "#2D6A4F",
        border: "1px solid rgba(45,106,79,0.25)", borderRadius: 9,
        cursor: "pointer", fontFamily: "inherit",
    },
    exportBtnAlt: {
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", fontSize: 13, fontWeight: 600,
        background: "#fff", color: "#374151",
        border: "1px solid #E5E7EB", borderRadius: 9,
        cursor: "pointer", fontFamily: "inherit",
    },
};
