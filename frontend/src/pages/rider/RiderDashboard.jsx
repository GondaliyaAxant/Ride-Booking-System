import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const RiderDashboard = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/bookings");
            const data = response.data.data || [];
            setBookings(data);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadBookings();
        const interval = setInterval(() => {
            loadBookings();
        }, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const completed = bookings.filter((x) => x.status === "completed").length;
    const pending = bookings.filter((x) => x.status === "pending").length;
    const activeList = bookings.filter((x) =>
        ["accepted", "driver_arriving", "driver_arrived", "ongoing"].includes(x.status)
    );
    const active = activeList.length;

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
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ margin: "0 0 6px", fontSize: "1.9rem" }}>
                        Welcome, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        Manage your rides, track active bookings, and schedule trips.
                    </p>
                </div>
                <Link to="/rider/book" className="btn btn-primary" style={{ padding: "12px 20px", fontSize: "1rem", fontWeight: 700 }}>
                    + Book a Ride
                </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: "28px" }}>
                <Stat icon="📋" title="Total Bookings" value={bookings.length} />
                <Stat icon="🚗" title="Active Rides" value={active} />
                <Stat icon="⏳" title="Pending" value={pending} />
                <Stat icon="✓" title="Completed" value={completed} />
            </div>

            {/* Active Rides Section */}
            {activeList.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", marginBottom: "14px" }}>
                        🚗 Active Rides ({activeList.length})
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {activeList.map((ride) => (
                            <div
                                key={ride._id}
                                style={{
                                    background: "#ffffff",
                                    border: "2px solid #16a34a",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    boxShadow: "0 4px 20px rgba(22, 163, 74, 0.08)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                                    <div>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.8rem",
                                                fontWeight: 700,
                                                background: "#dcfce7",
                                                color: "#15803d",
                                                textTransform: "uppercase",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            ● {ride.status?.replace("_", " ")}
                                        </span>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                            Scheduled: {formatDateTime(ride.bookingDate)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a" }}>
                                            ₹{ride.fare}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>
                                            {ride.paymentMethod || "cash"} • {ride.paymentStatus || "pending"}
                                        </div>
                                    </div>
                                </div>

                                {/* Driver & Vehicle Details */}
                                {ride.driver && (
                                    <div
                                        style={{
                                            background: "#f8fafc",
                                            padding: "14px 16px",
                                            borderRadius: "12px",
                                            marginBottom: "14px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.98rem" }}>
                                                👤 Driver: {ride.driver?.user?.name || "Assigned Driver"}{" "}
                                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                                                    ({ride.driver?.user?.gender || "Verified"})
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "0.84rem", color: "#475569", marginTop: "2px" }}>
                                                ⭐ Rating: {ride.driver?.rating || 5.0} / 5.0
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.92rem" }}>
                                                🚗 {ride.driver?.vehicle ? `${ride.driver.vehicle.brand} ${ride.driver.vehicle.model}` : `${ride.vehicleType?.toUpperCase()}`}
                                            </div>
                                            <div style={{ fontSize: "0.84rem", color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
                                                {ride.driver?.vehicle?.registrationNumber || ""}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Route info */}
                                <div style={{ fontSize: "0.9rem", color: "#334155", marginBottom: "16px" }}>
                                    <div style={{ marginBottom: "4px" }}>
                                        <strong>📍 Pickup:</strong> {ride.pickupLocation}
                                    </div>
                                    <div>
                                        <strong>🏁 Drop:</strong> {ride.dropLocation}
                                    </div>
                                </div>

                                <Link
                                    to={`/rider/bookings/${ride._id}`}
                                    className="btn btn-primary"
                                    style={{ display: "inline-block", textAlign: "center", width: "100%", padding: "10px", boxSizing: "border-box" }}
                                >
                                    Track Live Ride & Details →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Bookings Section */}
            <div className="content-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Recent Bookings</h2>
                    <Link to="/rider/bookings" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
                        View All ({bookings.length}) →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                        Loading recent bookings...
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🚕</div>
                        <h3 style={{ margin: "0 0 8px" }}>No bookings yet</h3>
                        <p style={{ color: "#6b7280", margin: "0 0 16px" }}>
                            Book your first ride to experience seamless travel.
                        </p>
                        <Link to="/rider/book" className="btn btn-primary">
                            Book Ride Now
                        </Link>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pickup</th>
                                    <th>Destination</th>
                                    <th>Date & Time</th>
                                    <th>Vehicle</th>
                                    <th>Fare</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.slice(0, 5).map((b) => (
                                    <tr key={b._id}>
                                        <td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {b.pickupLocation}
                                        </td>
                                        <td style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {b.dropLocation}
                                        </td>
                                        <td>{formatDateTime(b.bookingDate)}</td>
                                        <td style={{ textTransform: "capitalize" }}>
                                            {b.vehicleType === "bike" ? "🏍️ Bike" : b.vehicleType === "auto" ? "🛺 Auto" : "🚗 Car"}
                                        </td>
                                        <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{b.fare}</td>
                                        <td>
                                            <span className={`status status-${b.status}`}>
                                                {b.status?.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/rider/bookings/${b._id}`} className="btn btn-small" style={{ background: "#f3f4f6", color: "#374151" }}>
                                                Details
                                            </Link>
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

const Stat = ({ icon, title, value }) => (
    <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", background: "#ffffff", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
        <div style={{ fontSize: "2rem" }}>{icon}</div>
        <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>{title}</div>
            <strong style={{ fontSize: "1.5rem", color: "#111827" }}>{value}</strong>
        </div>
    </div>
);

export default RiderDashboard;