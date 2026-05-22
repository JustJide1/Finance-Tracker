import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/Toast";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setUser } = useAuthStore();
    const toast = useToast();

    useEffect(() => {
        const token     = searchParams.get("token");
        const error     = searchParams.get("error");
        const id        = searchParams.get("id");
        const firstName = searchParams.get("firstName");
        const email     = searchParams.get("email");
        const avatar    = searchParams.get("avatar");

        if (error || !token) {
            toast.error("Google sign-in failed. Please try again.");
            navigate("/", { replace: true });
            return;
        }

        localStorage.setItem("token", token);
        setUser({ id, firstName, email, avatar });
        toast.success(`Welcome${firstName ? `, ${firstName}` : " back"}!`);
        navigate("/dashboard", { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={S.wrapper}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={S.spinner} />
            <p style={S.text}>Signing you in...</p>
        </div>
    );
}

const S = {
    wrapper: {
        display: "grid", placeItems: "center", height: "100vh",
        background: "#061912", flexDirection: "column", gap: 16,
    },
    spinner: {
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(168,213,162,0.2)",
        borderTopColor: "#A8D5A2",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto",
    },
    text: { fontSize: 15, color: "rgba(241,245,249,0.6)", marginTop: 16, fontFamily: "'Inter', system-ui, sans-serif" },
};
