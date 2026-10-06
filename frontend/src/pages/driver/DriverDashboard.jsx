import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const DriverDashboard = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [driverProfile, setDriverProfile] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [loading, setLoading] = useState(true);
    const [availableCount, setAvailableCount] = useState(0);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [profileRes, bookingsRes, pendingRes] = await Promise.all([
                api.get("/drivers/me").catch(() => ({ data: { data: null } })),
                api.get("/bookings").catch(() => ({ data: { data: [] } })),
                api.get("/bookings/driver/pending").catch(() => ({ data: { data: [] } })),
            ]);

            const profile = profileRes.data.data;
            setDriverProfile(profile);
            if (profile) {
                setIsOnline(profile.isOnline !== false);
            }

            setBookings(bookingsRes.data.data || []);
            setAvailableCount((pendingRes.data.data || []).length);
        } catch (err) {
            console.error("Driver dashboard load error:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Poll every 10 seconds so dashboard stays up-to-date
        const interval = setInterval(() => loadData(true), 10000);
        return () => clearInterval(interval);
    }, [user]);

    const toggleOnline = async () => {
        try {
            const res = await api.patch("/drivers/status", {
                isOnline: !isOnline,
            });
            setIsOnline(res.data.data.isOnline);
        } catch (err) {
            console.error("Toggle online error:", err);
        }
    };

    const completedRides = bookings.filter((b) => b.status === "completed");
    const activeRides = bookings.filter((b) =>
        ["accepted", "driver_arriving", "driver_arrived", "ongoing"].includes(b.status)
    );
    const totalEarnings = completedRides.reduce(
        (sum, b) => sum + (Number(b.fare) || 0),
        0
    );


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
            {/* Header with Online / Offline toggle */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div>
                    <h1 style={{ margin: "0 0 4px", fontSize: "1.9rem" }}>
                        Driver Dashboard 👋
                    </h1>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        Logged in as <strong>{user?.name}</strong> • Driver Rating: ⭐{" "}
                        {driverProfile?.rating || "5.0"}
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                        onClick={toggleOnline}
                        style={{
                            padding: "10px 18px",
                            borderRadius: "20px",
                            border: "none",
                            background: isOnline ? "#16a34a" : "#6b7280",
                            color: "#ffffff",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <span
                            style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: "#ffffff",
                            }}
                        />
                        {isOnline ? "You are Online" : "You are Offline"}
                    </button>
                    <Link to="/driver/rides" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                        View Rides →
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: "28px" }}>
                <Stat icon="🚕" title="Assigned Rides" value={bookings.length} />
                <Stat icon="⚡" title="Active Rides" value={activeRides.length} />
                <Stat icon="🔔" title="Available Requests" value={availableCount} highlight={availableCount > 0} />
                <Stat icon="✓" title="Completed Trips" value={completedRides.length} />
                <Stat icon="₹" title="Total Earnings" value={`₹${totalEarnings}`} />
            </div>


            {/* Quick Action Navigation Cards */}
            <div className="quick-grid" style={{ marginBottom: "28px" }}>
                <Link to="/driver/rides" className="quick-card">
                    <span style={{ fontSize: "2rem" }}>🚕</span>
                    <strong>My Rides & Requests</strong>
                    <small>View assigned rides & accept incoming requests</small>
                </Link>
                <Link to="/driver/availability" className="quick-card">
                    <span style={{ fontSize: "2rem" }}>📅</span>
                    <strong>Set Availability</strong>
                    <small>Manage daily work schedule & time slots</small>
                </Link>
                <Link to="/driver/vehicle" className="quick-card">
                    <span style={{ fontSize: "2rem" }}>🚘</span>
                    <strong>Vehicle Details</strong>
                    <small>Manage registered cab/bike vehicle details</small>
                </Link>
            </div>

            {/* Assigned Rides Table */}
            <div
                className="content-card"
                style={{
                    background: "#ffffff",
                    padding: "24px",
                    borderRadius: "16px",
                    boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
                    border: "1px solid #f3f4f6",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Today's & Upcoming Rides</h2>
                    <Link to="/driver/rides" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
                        View All ({bookings.length}) →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                        Loading rides...
                    </div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🚕</div>
                        <h3 style={{ margin: "0 0 6px" }}>No assigned rides</h3>
                        <p style={{ color: "#6b7280", margin: "0 0 16px" }}>
                            Check available ride requests in the My Rides section or set your availability.
                        </p>
                        <Link to="/driver/rides" className="btn btn-primary">
                            Check Ride Requests
                        </Link>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rider</th>
                                    <th>Pickup</th>
                                    <th>Drop</th>
                                    <th>Scheduled Time</th>
                                    <th>Fare</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.slice(0, 6).map((b) => (
                                    <tr key={b._id}>
                                        <td>
                                            <strong>{b.user?.name || "Rider"}</strong>
                                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                                {b.user?.phone}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {b.pickupLocation}
                                        </td>
                                        <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {b.dropLocation}
                                        </td>
                                        <td>{formatDateTime(b.bookingDate)}</td>
                                        <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{b.fare}</td>
                                        <td>
                                            <span className={`status status-${b.status}`}>
                                                {b.status?.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to="/driver/rides" className="btn btn-small btn-primary">
                                                Manage
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

const Stat = ({ icon, title, value, highlight }) => (
    <div
        className="stat-card"
        style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "18px 20px",
            background: highlight ? "#fff7ed" : "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            border: highlight ? "1px solid #fed7aa" : "1px solid #f3f4f6",
        }}
    >
        <div style={{ fontSize: "2rem" }}>{icon}</div>
        <div>
            <div style={{ color: highlight ? "#ea580c" : "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>{title}</div>
            <strong style={{ fontSize: "1.5rem", color: highlight ? "#c2410c" : "#111827" }}>{value}</strong>
        </div>
    </div>
);

export default DriverDashboard;