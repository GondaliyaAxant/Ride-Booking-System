import {
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useAuth,
} from "../context/AuthContext";

const Login = () => {
    const {
        login,
        loading,
    } = useAuth();

    const navigate =
        useNavigate();

    const [form, setForm] =
        useState({
            email: "",
            password: "",
        });

    const [error, setError] =
        useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]:
                e.target.value,
        });
    };

    const handleSubmit =
        async (e) => {
            e.preventDefault();

            setError("");

            try {
                const user =
                    await login(
                        form.email,
                        form.password
                    );

                navigate(
                    `/${user.role}`
                );
            } catch (err) {
                setError(
                    err.response?.data
                        ?.message ||
                        "Invalid email or password."
                );
            }
        };

    return (
        <div className="auth-page">

            <div className="auth-box">

                <Link
                    to="/"
                    className="brand auth-brand"
                >
                    🚕 RideBook
                </Link>

                <span className="hero-badge">
                    WELCOME BACK
                </span>

                <h1>
                    Sign in
                </h1>

                <p className="muted">
                    Login to your RideBook
                    account.
                </p>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="form-group">
                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={
                                form.email
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={
                                form.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        className="btn btn-primary full-width"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In →"}
                    </button>

                </form>

                <p className="auth-bottom">
                    Don't have an account?
                    {" "}
                    <Link to="/register">
                        Create account
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default Login;