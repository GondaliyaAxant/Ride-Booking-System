import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/bookings");
            setBookings(response.data.data || []);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const isUpcoming = (item) => {
        const time = new Date(item.bookingDate).getTime();
        return time > Date.now() && ["pending", "accepted"].includes(item.status);
    };

    const filtered = bookings.filter((item) => {
        if (filter === "all") return true;
        if (filter === "upcoming") return isUpcoming(item);
        return item.status === filter;
    });

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div>
                    <h1 style={{ margin: "0 0 4px", fontSize: "1.8rem" }}>My Bookings</h1>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        View your ride history, active trips, and scheduled bookings.
                    </p>
                </div>
                <Link to="/rider/book" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                    + Book New Ride
                </Link>
            </div>

            {/* Filter Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "20px",
                    overflowX: "auto",
                    paddingBottom: "6px",
                }}
            >
                {[
                    { id: "all", label: "All Rides" },
                    { id: "upcoming", label: "📅 Scheduled / Upcoming" },
                    { id: "pending", label: "⏳ Pending" },
                    { id: "accepted", label: "✓ Accepted" },
                    { id: "ongoing", label: "🚕 Ongoing" },
                    { id: "completed", label: "🏁 Completed" },
                    { id: "cancelled", label: "❌ Cancelled" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: filter === tab.id ? "1px solid #16a34a" : "1px solid #e5e7eb",
                            background: filter === tab.id ? "#16a34a" : "#ffffff",
                            color: filter === tab.id ? "#ffffff" : "#374151",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Bookings Content */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
                    <p style={{ color: "#6b7280" }}>Loading your bookings...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div
                    style={{
                        background: "#ffffff",
                        padding: "40px 20px",
                        borderRadius: "14px",
                        textAlign: "center",
                        border: "1px solid #f3f4f6",
                    }}
                >
                    <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🚕</div>
                    <h3 style={{ margin: "0 0 6px" }}>No bookings found</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 16px" }}>
                        You don't have any bookings matching this filter.
                    </p>
                    <Link to="/rider/book" className="btn btn-primary">
                        Schedule a Ride Now
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filtered.map((booking) => (
                        <div
                            key={booking._id}
                            style={{
                                background: "#ffffff",
                                padding: "20px",
                                borderRadius: "14px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                border: "1px solid #f3f4f6",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                            }}
                        >
                            {/* Top row: Scheduled Date, Status & Women Safety badge */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                    borderBottom: "1px solid #f3f4f6",
                                    paddingBottom: "10px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>
                                        🕒 {formatDateTime(booking.bookingDate)}
                                    </span>
                                    {isUpcoming(booking) && (
                                        <span style={{ background: "#e0e7ff", color: "#3730a3", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                                            Scheduled Ride
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {booking.womenSafety && (
                                        <span style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8", fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "12px" }}>
                                            🛡️ Women Safety
                                        </span>
                                    )}
                                    <span className={`status status-${booking.status}`} style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                                        {booking.status?.replace("_", " ")}
                                    </span>
                                </div>
                            </div>

                            {/* Middle row: Route & Fare */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.6fr 1fr 1fr",
                                    gap: "16px",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                                        <span>🟢</span>
                                        <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.92rem" }}>
                                            {booking.pickupLocation}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <span>🔴</span>
                                        <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.92rem" }}>
                                            {booking.dropLocation}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <small style={{ color: "#6b7280", fontSize: "0.75rem" }}>Driver</small>
                                    <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}>
                                        {booking.driver?.user?.name ? (
                                            <>
                                                {booking.driver.user.gender === "female" ? "👩‍✈️ " : "👨‍✈️ "}
                                                {booking.driver.user.name}
                                            </>
                                        ) : (
                                            <span style={{ color: "#d97706" }}>🔍 Searching...</span>
                                        )}
                                    </div>
                                    <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "2px" }}>
                                        {booking.vehicleType === "bike" ? "🏍️ Bike" : booking.vehicleType === "auto" ? "🛺 Auto" : "🚗 Car"} • {booking.distanceKm} km
                                    </div>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#15803d" }}>
                                        ₹{booking.fare}
                                    </div>
                                    <Link
                                        to={`/rider/bookings/${booking._id}`}
                                        className="btn btn-primary btn-small"
                                        style={{ marginTop: "6px", display: "inline-block", fontSize: "0.85rem", padding: "6px 14px" }}
                                    >
                                        View Details →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;