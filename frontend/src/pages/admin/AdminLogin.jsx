import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";

const AdminLogin = () => {

    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await api.post(
                    "/admin/login",
                    {
                        email,
                        password,
                    }
                );

            const data =
                response.data;


            if (!data.success) {

                setError(
                    data.message ||
                    "Admin login failed"
                );

                return;
            }


            // Save ONLY admin authentication
            localStorage.setItem(
                "adminToken",
                data.token
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify(
                    data.user
                )
            );


            // Admin always goes to admin dashboard
            navigate(
                "/admin",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Invalid admin email or password"
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f3f4f6",
                padding: "20px",
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    padding: "32px",
                    borderRadius: "16px",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >

                <h1>
                    RideBook Admin
                </h1>

                <p
                    style={{
                        color: "#6b7280",
                        marginBottom: "25px",
                    }}
                >
                    Admin Login
                </p>


                {error && (
                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "18px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            borderRadius: "8px",
                        }}
                    >
                        {error}
                    </div>
                )}


                <form
                    onSubmit={handleSubmit}
                >

                    <label
                        style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "600",
                        }}
                    >
                        Email
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        placeholder="Admin email"
                        required
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginBottom: "18px",
                            border:
                                "1px solid #d1d5db",
                            borderRadius: "8px",
                            boxSizing:
                                "border-box",
                        }}
                    />


                    <label
                        style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "600",
                        }}
                    >
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        placeholder="Admin password"
                        required
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginBottom: "20px",
                            border:
                                "1px solid #d1d5db",
                            borderRadius: "8px",
                            boxSizing:
                                "border-box",
                        }}
                    />


                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "13px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#111827",
                            color: "#ffffff",
                            fontWeight: "600",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {loading
                            ? "Signing in..."
                            : "Admin Sign In"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default AdminLogin;