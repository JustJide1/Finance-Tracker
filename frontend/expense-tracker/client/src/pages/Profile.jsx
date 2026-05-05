import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import useAuthStore from "../store/authStore";
import PageLayout from "../components/PageLayout";
import { useToast } from "../components/Toast";

export default function Profile() {
    const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [deletePassword, setDeletePassword] = useState("");
    const [loading, setLoading] = useState({ profile: false, password: false, delete: false });
    const [activeTab, setActiveTab] = useState("profile");
    const toast = useToast();
    const { setUser, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const data = await authService.getProfile();
            setProfile({ firstName: data.firstName, lastName: data.lastName, email: data.email });
        } catch { console.error("Failed to fetch profile"); }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!profile.firstName || !profile.lastName || !profile.email) return toast.error("All fields are required");
        setLoading(l => ({ ...l, profile: true }));
        try {
            const data = await authService.updateProfile(profile);
            setUser(data.user);
            toast.success("Profile updated");
        } catch (err) { toast.error(err.response?.data?.message || "Failed to update"); }
        finally { setLoading(l => ({ ...l, profile: false })); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!passwords.currentPassword || !passwords.newPassword) return toast.error("All password fields are required");
        if (passwords.newPassword.length < 8) return toast.error("New password must be at least 8 characters");
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords don't match");
        setLoading(l => ({ ...l, password: true }));
        try {
            await authService.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            toast.success("Password changed");
        } catch (err) { toast.error(err.response?.data?.message || "Failed to change password"); }
        finally { setLoading(l => ({ ...l, password: false })); }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return toast.error("Enter your password to confirm");
        if (!window.confirm("This will permanently delete your account and all data. This cannot be undone.")) return;
        setLoading(l => ({ ...l, delete: true }));
        try {
            await authService.deleteAccount({ password: deletePassword });
            logout(); navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete account");
            setLoading(l => ({ ...l, delete: false }));
        }
    };

    const TABS = [
        { id: "profile",  label: "Profile"         },
        { id: "password", label: "Password"         },
        { id: "danger",   label: "Delete Account"   },
    ];

    return (
        <PageLayout
            activeTab="settings"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); }}
            title="Account Settings"
            subtitle="Manage your profile and security"
            contentStyle={{ maxWidth: 800, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={S.tabs}>
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        style={{ ...S.tab, ...(activeTab === id ? (id === "danger" ? S.tabDanger : S.tabActive) : {}) }}
                        onClick={() => setActiveTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "profile" && (
                <div style={S.card}>
                    <h3 style={S.cardTitle}>Personal Information</h3>
                    <form onSubmit={handleProfileUpdate}>
                        <div style={S.row}>
                            <div style={S.field}>
                                <label style={S.label}>First Name</label>
                                <input style={S.input} type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                            </div>
                            <div style={S.field}>
                                <label style={S.label}>Last Name</label>
                                <input style={S.input} type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div style={S.field}>
                            <label style={S.label}>Email Address</label>
                            <input style={S.input} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                        </div>
                        <button style={S.btnPrimary} type="submit" disabled={loading.profile}>
                            {loading.profile ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "password" && (
                <div style={S.card}>
                    <h3 style={S.cardTitle}>Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        {[
                            { label: "Current Password", key: "currentPassword" },
                            { label: "New Password",     key: "newPassword",     placeholder: "Min. 8 characters" },
                            { label: "Confirm Password", key: "confirmPassword" },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key} style={S.field}>
                                <label style={S.label}>{label}</label>
                                <input style={S.input} type="password" placeholder={placeholder} value={passwords[key]} onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} />
                            </div>
                        ))}
                        <button style={S.btnPrimary} type="submit" disabled={loading.password}>
                            {loading.password ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "danger" && (
                <div style={{ ...S.card, borderColor: "rgba(220,38,38,0.25)" }}>
                    <h3 style={{ ...S.cardTitle, color: "#DC2626" }}>Delete Account</h3>
                    <p style={S.warning}>
                        This will permanently delete your account and ALL transaction data. This cannot be undone.
                    </p>
                    <div style={S.field}>
                        <label style={S.label}>Enter your password to confirm</label>
                        <input style={S.input} type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                    </div>
                    <button style={S.btnDanger} onClick={handleDeleteAccount} disabled={loading.delete}>
                        {loading.delete ? "Deleting..." : "Delete My Account"}
                    </button>
                </div>
            )}
        </PageLayout>
    );
}

const S = {
    tabs: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
    tab: {
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 500,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        color: "#6B7280",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
    },
    tabActive: { background: "rgba(45,106,79,0.10)", color: "#2D6A4F", border: "1px solid rgba(45,106,79,0.3)" },
    tabDanger: { background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)" },
    card: { background: "#FFFFFF", borderRadius: "clamp(12px, 2vw, 16px)", padding: "1.5rem", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    cardTitle: { fontSize: 16, fontWeight: 600, color: "#111111", margin: "0 0 1.5rem" },
    row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
    field: { marginBottom: "1rem" },
    label: { display: "block", fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 6 },
    input: { width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #E5E7EB", borderRadius: 12, outline: "none", background: "#F9FAFB", color: "#111111", boxSizing: "border-box", fontFamily: "inherit" },
    btnPrimary: { padding: "11px 24px", fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", marginTop: "0.5rem", fontFamily: "inherit" },
    btnDanger:  { padding: "11px 24px", fontSize: 14, fontWeight: 600, background: "#DC2626", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", marginTop: "0.5rem", fontFamily: "inherit" },
    warning: { fontSize: 13, color: "#DC2626", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", lineHeight: 1.5 },
};
