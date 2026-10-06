import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Availability = () => {
    const { user } = useAuth();
    const [driver, setDriver] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTodayStr = () => {
        const d = new Date();
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
    };

    const [form, setForm] = useState({
        date: getTodayStr(),
        startTime: "09:00",
        endTime: "18:00",
        isAvailable: true,
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const profileRes = await api.get("/drivers/me").catch(() => ({ data: { data: null } }));
            const profile = profileRes.data.data;
            setDriver(profile);

            if (profile?._id) {
                const availRes = await api.get(`/driver-availability/driver/${profile._id}`);
                setItems(availRes.data.data || []);
            }
        } catch (err) {
            console.error("Availability load error:", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const setQuickDate = (daysAhead) => {
        const target = new Date();
        target.setDate(target.getDate() + daysAhead);
        const str = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
        setForm((prev) => ({ ...prev, date: str }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await api.post("/driver-availability", {
                driver: driver?._id,
                date: form.date,
                startTime: form.startTime,
                endTime: form.endTime,
                isAvailable: form.isAvailable,
            });

            setSuccess("Schedule added successfully! Eligible pending rides checked.");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save availability.");
        }
    };

    const handleToggle = async (item) => {
        try {
            await api.put(`/driver-availability/${item._id}`, {
                isAvailable: !item.isAvailable,
            });
            await loadData();
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;

        try {
            await api.delete(`/driver-availability/${id}`);
            await loadData();
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const formatDate = (val) => {
        if (!val) return "—";
        return new Date(val).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "1.8rem" }}>Driver Availability</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Set the dates and time windows when you are ready to receive ride requests.
                </p>
            </div>

            {error && (
                <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#991b1b", borderRadius: "10px", marginBottom: "16px" }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: "12px 16px", background: "#dcfce7", color: "#166534", borderRadius: "10px", marginBottom: "16px" }}>
                    {success}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
                {/* Form Card */}
                <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: "1.2rem" }}>+ Add Working Hours</h2>

                    <form onSubmit={handleSubmit}>
                        {/* Quick Day Buttons */}
                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, marginBottom: "6px" }}>
                                Quick Day Select:
                            </label>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                <button type="button" onClick={() => setQuickDate(0)} style={{ padding: "5px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}>
                                    Today
                                </button>
                                <button type="button" onClick={() => setQuickDate(1)} style={{ padding: "5px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}>
                                    Tomorrow
                                </button>
                                <button type="button" onClick={() => setQuickDate(2)} style={{ padding: "5px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}>
                                    +2 Days
                                </button>
                                <button type="button" onClick={() => setQuickDate(3)} style={{ padding: "5px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}>
                                    +3 Days
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                required
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                            <div>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", cursor: "pointer", fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={form.isAvailable}
                                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                            />
                            <span>Mark as Available during this slot</span>
                        </label>

                        <button className="btn btn-primary" style={{ width: "100%", padding: "12px", fontWeight: 700 }}>
                            ✓ Save Working Schedule
                        </button>
                    </form>
                </div>

                {/* Schedules List */}
                <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: "1.2rem" }}>Active Schedules ({items.length})</h2>

                    {loading ? (
                        <div style={{ color: "#6b7280" }}>Loading schedules...</div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 10px", color: "#6b7280" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📅</div>
                            <p>No availability schedules saved yet. Add your working hours to start receiving ride bookings.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {items.map((item) => (
                                <div
                                    key={item._id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "12px 14px",
                                        background: item.isAvailable ? "#f0fdf4" : "#f9fafb",
                                        border: item.isAvailable ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: "0.95rem", color: "#111827" }}>
                                            {formatDate(item.date)}
                                        </strong>
                                        <div style={{ color: "#4b5563", fontSize: "0.85rem", marginTop: "2px" }}>
                                            🕒 {item.startTime} - {item.endTime}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <button
                                            onClick={() => handleToggle(item)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "14px",
                                                border: "none",
                                                background: item.isAvailable ? "#16a34a" : "#9ca3af",
                                                color: "#ffffff",
                                                fontWeight: 700,
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {item.isAvailable ? "Available" : "Off"}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                border: "1px solid #fecaca",
                                                background: "#fee2e2",
                                                color: "#991b1b",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Availability;