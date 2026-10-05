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

const Register = () => {
    const {
        register,
        loading,
    } = useAuth();

    const navigate =
        useNavigate();

    const [form, setForm] =
        useState({
            name: "",
            email: "",
            phone: "",
            password: "",
            gender: "",
            role: "rider",
        });

    const [error, setError] =
        useState("");

    const change = (e) => {
        setForm({
            ...form,
            [e.target.name]:
                e.target.value,
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        setError("");

        try {
            await register(form);

            navigate("/login");
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    "Registration failed."
            );
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-box register-box">

                <Link
                    to="/"
                    className="brand auth-brand"
                >
                    🚕 RideBook
                </Link>

                <span className="hero-badge">
                    CREATE ACCOUNT
                </span>

                <h1>
                    Join RideBook
                </h1>

                <p className="muted">
                    Create your rider or
                    driver account.
                </p>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form
                    className="form-grid"
                    onSubmit={submit}
                >

                    <div className="form-group">
                        <label>
                            Full Name
                        </label>

                        <input
                            name="name"
                            value={form.name}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Phone
                        </label>

                        <input
                            name="phone"
                            value={form.phone}
                            onChange={change}
                            placeholder="+91..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={change}
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
                            value={form.password}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Gender
                        </label>

                        <select
                            name="gender"
                            value={
                                form.gender
                            }
                            onChange={change}
                            required
                        >
                            <option value="">
                                Select gender
                            </option>

                            <option value="female">
                                Female
                            </option>

                            <option value="male">
                                Male
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            Account Type
                        </label>

                        <select
                            name="role"
                            value={form.role}
                            onChange={change}
                        >
                            <option value="rider">
                                Rider
                            </option>

                            <option value="driver">
                                Driver
                            </option>
                        </select>
                    </div>

                    <button
                        className="btn btn-primary full-width grid-full"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Creating..."
                            : "Create Account →"}
                    </button>

                </form>

                <p className="auth-bottom">
                    Already have an account?
                    {" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default Register;