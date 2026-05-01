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
        } catch (err) {
            console.error("Failed to fetch profile");
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!profile.firstName || !profile.lastName || !profile.email) return toast.error("All fields are required");
        setLoading(l => ({ ...l, profile: true }));
        try {
            const data = await authService.updateProfile(profile);
            setUser(data.user);
            toast.success("Profile updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update");
        } finally {
            setLoading(l => ({ ...l, profile: false }));
        }
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
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(l => ({ ...l, password: false }));
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return toast.error("Enter your password to confirm");
        if (!window.confirm("This will permanently delete your account and all data. This cannot be undone.")) return;
        setLoading(l => ({ ...l, delete: true }));
        try {
            await authService.deleteAccount({ password: deletePassword });
            logout();
            navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete account");
            setLoading(l => ({ ...l, delete: false }));
        }
    };

    return (
        <PageLayout
            activeTab="profile"
            onNavClick={(tab) => { if (tab === "dashboard") navigate("/dashboard"); }}
            title="Account Settings"
            subtitle="Manage your profile and account"
            contentStyle={{ maxWidth: 800, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
            <div style={styles.tabs}>
                {[
                    { id: "profile",  label: "Profile" },
                    { id: "password", label: "Password" },
                    { id: "danger",   label: "Delete Account" },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        style={{ ...styles.tab, ...(activeTab === id ? (id === "danger" ? styles.tabDanger : styles.tabActive) : {}) }}
                        onClick={() => setActiveTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "profile" && (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Personal Information</h3>
                    <form onSubmit={handleProfileUpdate}>
                        <div style={styles.row}>
                            <div style={styles.field}>
                                <label style={styles.label}>First Name</label>
                                <input style={styles.input} type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Last Name</label>
                                <input style={styles.input} type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Email Address</label>
                            <input style={styles.input} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                        </div>
                        <button style={styles.btnPrimary} type="submit" disabled={loading.profile}>
                            {loading.profile ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "password" && (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        {[
                            { label: "Current Password", key: "currentPassword" },
                            { label: "New Password",     key: "newPassword",     placeholder: "Min. 8 characters" },
                            { label: "Confirm Password", key: "confirmPassword" },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key} style={styles.field}>
                                <label style={styles.label}>{label}</label>
                                <input style={styles.input} type="password" placeholder={placeholder} value={passwords[key]} onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} />
                            </div>
                        ))}
                        <button style={styles.btnPrimary} type="submit" disabled={loading.password}>
                            {loading.password ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "danger" && (
                <div style={{ ...styles.card, borderColor: "rgba(244,63,94,0.3)" }}>
                    <h3 style={{ ...styles.cardTitle, color: "#f43f5e" }}>Delete Account</h3>
                    <p style={styles.warning}>
                        This will permanently delete your account and ALL transaction data. This cannot be undone.
                    </p>
                    <div style={styles.field}>
                        <label style={styles.label}>Enter your password to confirm</label>
                        <input style={styles.input} type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                    </div>
                    <button style={styles.btnDanger} onClick={handleDeleteAccount} disabled={loading.delete}>
                        {loading.delete ? "Deleting..." : "Delete My Account"}
                    </button>
                </div>
            )}
        </PageLayout>
    );
}

const styles = {
    tabs: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
    tab: { padding: "9px 18px", fontSize: 13, fontWeight: 500, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" },
    tabActive: { background: "#6366f1", color: "#fff", border: "1px solid #6366f1" },
    tabDanger: { background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" },
    card: { background: "#1e293b", borderRadius: "clamp(12px, 2vw, 16px)", padding: "1.5rem", border: "1px solid #334155", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" },
    cardTitle: { fontSize: 16, fontWeight: 600, color: "#f1f5f9", margin: "0 0 1.5rem" },
    row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
    field: { marginBottom: "1rem" },
    label: { display: "block", fontSize: 12, fontWeight: 500, color: "#94a3b8", marginBottom: 6 },
    input: { width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #334155", borderRadius: 12, outline: "none", background: "#334155", color: "#f1f5f9", boxSizing: "border-box", fontFamily: "inherit" },
    btnPrimary: { padding: "11px 24px", fontSize: 14, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", marginTop: "0.5rem", fontFamily: "inherit" },
    btnDanger: { padding: "11px 24px", fontSize: 14, fontWeight: 600, background: "#f43f5e", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", marginTop: "0.5rem", fontFamily: "inherit" },
    warning: { fontSize: 13, color: "#fb7185", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", lineHeight: 1.5 },
};
