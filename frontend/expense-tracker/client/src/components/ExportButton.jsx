import { useState } from "react";
import Papa from "papaparse";
import { transactionService } from "../api/transactionService";
import { useToast } from "./Toast";

export default function ExportButton() {
    const [exporting, setExporting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const toast = useToast();

    const handleExport = async (filterType = "all") => {
        setExporting(true);
        setShowMenu(false);
        try {
            const data = await transactionService.getTransactions();
            let filtered = data;
            const now = new Date();

            if (filterType === "income")        filtered = data.filter(t => t.type === "income");
            else if (filterType === "expenses")  filtered = data.filter(t => t.type === "expense");
            else if (filterType === "thisMonth") filtered = data.filter(t => new Date(t.date) >= new Date(now.getFullYear(), now.getMonth(), 1));
            else if (filterType === "thisYear")  filtered = data.filter(t => new Date(t.date) >= new Date(now.getFullYear(), 0, 1));

            if (filtered.length === 0) { toast.info("No transactions to export for this filter."); setExporting(false); return; }

            const csv = Papa.unparse(filtered.map(t => ({
                Date: new Date(t.date).toLocaleDateString(),
                Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                Category: t.category,
                Description: t.description,
                Amount: t.amount,
                "Created At": new Date(t.createdAt).toLocaleString(),
            })));

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `fintrack_${filterType}_${now.toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to export. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const menuOptions = [
        { id: "all",        label: "All transactions" },
        { id: "income",     label: "Income only"      },
        { id: "expenses",   label: "Expenses only"    },
        { id: "thisMonth",  label: "This month"       },
        { id: "thisYear",   label: "This year"        },
    ];

    return (
        <div style={S.wrapper}>
            <button style={S.btn} onClick={() => setShowMenu(!showMenu)} disabled={exporting}>
                {exporting ? "Exporting..." : "Export CSV"}
            </button>

            {showMenu && (
                <>
                    <div style={S.overlay} onClick={() => setShowMenu(false)} />
                    <div style={S.menu}>
                        <div style={S.menuHeader}>Export options</div>
                        {menuOptions.map((opt) => (
                            <button key={opt.id} style={S.menuItem} onClick={() => handleExport(opt.id)}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const S = {
    wrapper: { position: "relative", display: "inline-block" },
    btn: {
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 600,
        background: "rgba(45,106,79,0.08)",
        color: "#2D6A4F",
        border: "1px solid rgba(45,106,79,0.25)",
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    overlay: { position: "fixed", inset: 0, zIndex: 100 },
    menu: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        padding: "0.375rem",
        minWidth: 200,
        zIndex: 101,
        border: "1px solid #E5E7EB",
    },
    menuHeader: {
        fontSize: 11,
        fontWeight: 600,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "8px 12px 6px",
    },
    menuItem: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "9px 12px",
        fontSize: 13,
        background: "transparent",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        color: "#374151",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "background 0.15s",
    },
};
