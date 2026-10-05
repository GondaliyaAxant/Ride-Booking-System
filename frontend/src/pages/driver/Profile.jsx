import {
    useState,
} from "react";

import api from "../../api/axios";

import {
    useAuth,
} from "../../context/AuthContext";

const Profile = () => {
    const {
        user,
        updateUser,
    } = useAuth();

    const [form, setForm] =
        useState({
            name:
                user?.name || "",
            email:
                user?.email || "",
            phone:
                user?.phone || "",
            gender:
                user?.gender || "",
        });

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const change = (e) => {
        setForm({
            ...form,
            [e.target.name]:
                e.target.value,
        });
    };

    const submit = async (
        e
    ) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const response =
                await api.put(
                    `/users/${
                        user._id ||
                        user.id
                    }`,
                    form
                );

            const updated =
                response.data.data ||
                response.data.user ||
                response.data;

            updateUser(updated);

            setMessage(
                "Profile updated successfully."
            );
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    "Unable to update profile."
            );
        }
    };

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Driver Profile
                    </h1>

                    <p>
                        Manage your
                        personal details.
                    </p>
                </div>

            </div>

            <div className="content-card">

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

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
                            Name
                        </label>

                        <input
                            name="name"
                            value={form.name}
                            onChange={change}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Email
                        </label>

                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={change}
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
                        >
                            <option value="">
                                Select
                            </option>

                            <option value="male">
                                Male
                            </option>

                            <option value="female">
                                Female
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>

                    <button className="btn btn-primary grid-full">
                        Save Changes
                    </button>

                </form>

            </div>

        </div>
    );
};

export default Profile;