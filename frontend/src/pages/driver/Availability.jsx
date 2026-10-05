import {
    useEffect,
    useState,
} from "react";

import api from "../../api/axios";

import {
    useAuth,
} from "../../context/AuthContext";

const Availability = () => {
    const { user } =
        useAuth();

    const [driver, setDriver] =
        useState(null);

    const [items, setItems] =
        useState([]);

    const [form, setForm] =
        useState({
            date: "",
            startTime: "09:00",
            endTime: "18:00",
            isAvailable: true,
        });

    const [error, setError] =
        useState("");

    const load = async () => {
        try {
            const response =
                await api.get(
                    "/drivers"
                );

            const drivers =
                response.data.data ||
                [];

            const found =
                drivers.find(
                    (item) =>
                        item.user?._id ===
                            user?._id ||
                        item.user ===
                            user?._id ||
                        item.user?._id ===
                            user?.id ||
                        item.user ===
                            user?.id
                );

            setDriver(found);

            if (!found) return;

            const availability =
                await api.get(
                    `/driver-availability/driver/${found._id}`
                );

            setItems(
                availability.data.data ||
                    []
            );
        } catch {
            setItems([]);
        }
    };

    useEffect(() => {
        load();
    }, [user]);

    const submit = async (
        e
    ) => {
        e.preventDefault();

        setError("");

        try {
            await api.post(
                "/driver-availability",
                {
                    driver:
                        driver._id,

                    date:
                        form.date,

                    startTime:
                        form.startTime,

                    endTime:
                        form.endTime,

                    isAvailable:
                        form.isAvailable,
                }
            );

            setForm({
                date: "",
                startTime:
                    "09:00",
                endTime:
                    "18:00",
                isAvailable: true,
            });

            await load();
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    "Unable to save availability."
            );
        }
    };

    const toggle =
        async (item) => {
            try {
                await api.put(
                    `/driver-availability/${item._id}`,
                    {
                        isAvailable:
                            !item.isAvailable,
                    }
                );

                load();
            } catch {}
        };

    const remove =
        async (id) => {
            if (
                !window.confirm(
                    "Delete this availability?"
                )
            ) {
                return;
            }

            try {
                await api.delete(
                    `/driver-availability/${id}`
                );

                load();
            } catch {}
        };

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Availability
                    </h1>

                    <p>
                        Set when you are
                        available.
                    </p>
                </div>

            </div>

            <div className="two-column">

                <div className="content-card">

                    <h2>
                        Add Schedule
                    </h2>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                    >

                        <div className="form-group">
                            <label>
                                Date
                            </label>

                            <input
                                type="date"
                                value={
                                    form.date
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        date:
                                            e
                                                .target
                                                .value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="form-grid">

                            <div className="form-group">
                                <label>
                                    Start
                                </label>

                                <input
                                    type="time"
                                    value={
                                        form.startTime
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setForm(
                                            {
                                                ...form,
                                                startTime:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    End
                                </label>

                                <input
                                    type="time"
                                    value={
                                        form.endTime
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setForm(
                                            {
                                                ...form,
                                                endTime:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                />
                            </div>

                        </div>

                        <label className="checkbox-row">

                            <input
                                type="checkbox"
                                checked={
                                    form.isAvailable
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        isAvailable:
                                            e
                                                .target
                                                .checked,
                                    })
                                }
                            />

                            <span>
                                Available
                            </span>

                        </label>

                        <button className="btn btn-primary">
                            Save Schedule
                        </button>

                    </form>

                </div>

                <div className="content-card">

                    <h2>
                        My Schedule
                    </h2>

                    {items.map(
                        (item) => (
                            <div
                                className="schedule-item"
                                key={
                                    item._id
                                }
                            >

                                <div>
                                    <strong>
                                        {formatDate(
                                            item.date
                                        )}
                                    </strong>

                                    <small>
                                        {
                                            item.startTime
                                        }{" "}
                                        -{" "}
                                        {
                                            item.endTime
                                        }
                                    </small>
                                </div>

                                <button
                                    className={
                                        item.isAvailable
                                            ? "availability on"
                                            : "availability off"
                                    }
                                    onClick={() =>
                                        toggle(
                                            item
                                        )
                                    }
                                >
                                    {item.isAvailable
                                        ? "Available"
                                        : "Off"}
                                </button>

                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        remove(
                                            item._id
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>
                        )
                    )}

                </div>

            </div>

        </div>
    );
};

const formatDate = (
    value
) => {
    if (!value) return "";

    return new Date(
        value
    ).toLocaleDateString(
        "en-IN"
    );
};

export default Availability;