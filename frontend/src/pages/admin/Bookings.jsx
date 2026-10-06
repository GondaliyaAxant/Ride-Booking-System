import { useEffect, useState } from "react";
import api from "../../api/axios";

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/bookings");
            setBookings(res.data.data || []);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const filtered = bookings.filter((b) => {
        if (filter === "all") return true;
        if (filter === "women_safety") return b.womenSafety;
        return b.status === filter;
    });

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "1.8rem" }}>Admin Booking Management</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Monitor all customer bookings, driver assignments, and Women Safety preferences.
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
                {[
                    { id: "all", label: `All (${bookings.length})` },
                    { id: "women_safety", label: `🛡️ Women Safety (${bookings.filter((b) => b.womenSafety).length})` },
                    { id: "pending", label: "⏳ Pending" },
                    { id: "accepted", label: "✓ Accepted" },
                    { id: "ongoing", label: "🚕 Ongoing" },
                    { id: "completed", label: "🏁 Completed" },
                    { id: "cancelled", label: "❌ Cancelled" },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: filter === t.id ? "1px solid #16a34a" : "1px solid #e5e7eb",
                            background: filter === t.id ? "#16a34a" : "#ffffff",
                            color: filter === t.id ? "#ffffff" : "#374151",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table Card */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>Loading bookings...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>No bookings found.</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Rider</th>
                                    <th>Driver & Gender</th>
                                    <th>Pickup → Drop</th>
                                    <th>Scheduled Date</th>
                                    <th>Women Safety</th>
                                    <th>Male Consent</th>
                                    <th>Fare</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b._id}>
                                        <td style={{ fontSize: "0.8rem", color: "#6b7280", fontFamily: "monospace" }}>
                                            {b._id.slice(-6)}
                                        </td>
                                        <td>
                                            <strong>{b.user?.name || "Rider"}</strong>
                                            <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "capitalize" }}>
                                                {b.user?.gender} • {b.user?.phone}
                                            </div>
                                        </td>
                                        <td>
                                            {b.driver?.user?.name ? (
                                                <div>
                                                    <strong>{b.driver.user.name}</strong>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "capitalize" }}>
                                                        {b.driver.user.gender === "female" ? "👩 Female Driver" : "👨 Male Driver"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#d97706", fontSize: "0.85rem" }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td style={{ maxWidth: "200px", fontSize: "0.85rem" }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                🟢 {b.pickupLocation}
                                            </div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                🔴 {b.dropLocation}
                                            </div>
                                        </td>
                                        <td>{formatDateTime(b.bookingDate)}</td>
                                        <td>
                                            {b.womenSafety ? (
                                                <span style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                                                    🛡️ Active
                                                </span>
                                            ) : (
                                                <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            {b.womenSafety ? (
                                                <span
                                                    style={{
                                                        fontSize: "0.78rem",
                                                        fontWeight: 600,
                                                        color:
                                                            b.maleDriverConsent === "accepted"
                                                                ? "#16a34a"
                                                                : b.maleDriverConsent === "declined"
                                                                ? "#dc2626"
                                                                : b.maleDriverConsent === "pending"
                                                                ? "#d97706"
                                                                : "#6b7280",
                                                    }}
                                                >
                                                    {b.maleDriverConsent?.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>N/A</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{b.fare}</td>
                                        <td>
                                            <span className={`status status-${b.status}`}>
                                                {b.status?.replace("_", " ")}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookings;