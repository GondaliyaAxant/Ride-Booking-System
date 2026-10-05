import {
    useEffect,
    useState,
} from "react";

import api from "../../api/axios";

import {
    useAuth,
} from "../../context/AuthContext";

const Vehicle = () => {
    const { user } =
        useAuth();

    const [driver, setDriver] =
        useState(null);

    const [vehicle, setVehicle] =
        useState(null);

    const [form, setForm] =
        useState({
            vehicleType: "car",
            brand: "",
            model: "",
            color: "",
            registrationNumber:
                "",
            capacity: 4,
        });

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const load = async () => {
        try {
            const drivers =
                await api.get(
                    "/drivers"
                );

            const found =
                (
                    drivers.data
                        .data || []
                ).find(
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

            const vehicles =
                await api.get(
                    "/vehicles"
                );

            const own =
                (
                    vehicles.data
                        .data || []
                ).find(
                    (item) =>
                        item.driver?._id ===
                            found._id ||
                        item.driver ===
                            found._id
                );

            if (own) {
                setVehicle(own);

                setForm({
                    vehicleType:
                        own.vehicleType ||
                        "car",

                    brand:
                        own.brand || "",

                    model:
                        own.model || "",

                    color:
                        own.color || "",

                    registrationNumber:
                        own.registrationNumber ||
                        "",

                    capacity:
                        own.capacity ||
                        4,
                });
            }
        } catch {}
    };

    useEffect(() => {
        load();
    }, [user]);

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

        setError("");
        setMessage("");

        try {
            const payload = {
                ...form,
                capacity: Number(
                    form.capacity
                ),
                driver:
                    driver._id,
            };

            if (vehicle) {
                await api.put(
                    `/vehicles/${vehicle._id}`,
                    payload
                );
            } else {
                await api.post(
                    "/vehicles",
                    payload
                );
            }

            setMessage(
                "Vehicle saved successfully."
            );

            load();
        } catch (err) {
            setError(
                err.response?.data
                    ?.message ||
                    "Unable to save vehicle."
            );
        }
    };

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        My Vehicle
                    </h1>

                    <p>
                        Manage your
                        registered vehicle.
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
                            Vehicle Type
                        </label>

                        <select
                            name="vehicleType"
                            value={
                                form.vehicleType
                            }
                            onChange={change}
                        >
                            <option value="bike">
                                Bike
                            </option>

                            <option value="auto">
                                Auto
                            </option>

                            <option value="car">
                                Car
                            </option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            Capacity
                        </label>

                        <input
                            type="number"
                            name="capacity"
                            min="1"
                            value={
                                form.capacity
                            }
                            onChange={change}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Brand
                        </label>

                        <input
                            name="brand"
                            value={form.brand}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Model
                        </label>

                        <input
                            name="model"
                            value={form.model}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Color
                        </label>

                        <input
                            name="color"
                            value={form.color}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Registration Number
                        </label>

                        <input
                            name="registrationNumber"
                            value={
                                form.registrationNumber
                            }
                            onChange={change}
                            required
                        />
                    </div>

                    <button className="btn btn-primary grid-full">
                        {vehicle
                            ? "Update Vehicle"
                            : "Add Vehicle"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default Vehicle;