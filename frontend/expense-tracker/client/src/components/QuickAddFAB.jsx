import { useState, useEffect, useRef, useCallback } from "react";
import QuickAdd from "./QuickAdd";
import { useToast } from "./Toast";

export default function QuickAddFAB() {
    const [open, setOpen] = useState(false);
    const fabRef = useRef(null);
    const dialogRef = useRef(null);
    const toast = useToast();

    const handleSuccess = useCallback(() => {
        setOpen(false);
        toast.success("Transaction added!");
    }, [toast]);

    const handleClose = useCallback(() => setOpen(false), []);

    // Escape key + focus trap
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") { setOpen(false); return; }
            if (e.key !== "Tab" || !dialogRef.current) return;
            const focusable = Array.from(
                dialogRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    // Move focus into dialog on open; return to FAB on close
    useEffect(() => {
        if (open && dialogRef.current) {
            const first = dialogRef.current.querySelector(
                'button:not([disabled]), input:not([disabled]), select:not([disabled])'
            );
            if (first) first.focus();
        } else if (!open && fabRef.current) {
            fabRef.current.focus();
        }
    }, [open]);

    // Inject hover/focus-visible styles once
    useEffect(() => {
        const id = "quickadd-fab-css";
        if (document.getElementById(id)) return;
        const el = document.createElement("style");
        el.id = id;
        el.textContent = `
            .qa-fab:hover { transform: scale(1.1) !important; box-shadow: 0 12px 32px rgba(26,71,49,0.45) !important; }
            .qa-fab:focus-visible { outline: 3px solid #2D6A4F !important; outline-offset: 3px !important; }
            .qa-fab-close:hover { background: #F3F4F6 !important; color: #374151 !important; }
        `;
        document.head.appendChild(el);
    }, []);

    return (
        <>
            <button
                ref={fabRef}
                className="qa-fab"
                style={S.fab}
                onClick={() => setOpen(true)}
                aria-label="Quick add transaction"
                title="Quick add transaction"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            {open && (
                <div
                    style={S.overlay}
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                    role="presentation"
                >
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Quick add transaction"
                        style={S.dialog}
                    >
                        <div style={S.topRow}>
                            <span style={S.topLabel}>Quick Add</span>
                            <button
                                className="qa-fab-close"
                                style={S.closeBtn}
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <QuickAdd onSuccess={handleSuccess} />
                    </div>
                </div>
            )}
        </>
    );
}

const S = {
    fab: {
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 54,
        height: 54,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(26,71,49,0.35)",
        zIndex: 30,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        outline: "none",
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
    },
    dialog: {
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        maxWidth: 520,
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "0.875rem",
    },
    topRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
    },
    topLabel: {
        fontSize: 11,
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
    },
    closeBtn: {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#9CA3AF",
        padding: 4,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        fontFamily: "inherit",
    },
};
