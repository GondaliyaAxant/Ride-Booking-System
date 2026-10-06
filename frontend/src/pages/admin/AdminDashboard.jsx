import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/dashboard-stats");
            setStats(res.data.data);
        } catch (err) {
            console.error("Failed to load admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ margin: "0 0 4px", fontSize: "2rem" }}>Admin Dashboard</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Platform overview, statistics, and Women Safety monitoring.
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Loading platform analytics...
                </div>
            ) : (
                <>
                    {/* Primary Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: "28px" }}>
                        <Stat icon="👥" title="Total Registered Users" value={stats?.totalUsers || 0} />
                        <Stat icon="🚗" title="Total Drivers" value={`${stats?.approvedDrivers || 0} Approved / ${stats?.totalDrivers || 0} Total`} />
                        <Stat icon="📋" title="Total Bookings" value={stats?.totalBookings || 0} />
                        <Stat icon="₹" title="Total Completed Revenue" value={`₹${stats?.totalRevenue || 0}`} />
                    </div>

                    {/* WOMEN SAFETY MONITORING CARD */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
                            border: "1px solid #fbcfe8",
                            borderRadius: "16px",
                            padding: "24px",
                            marginBottom: "28px",
                            boxShadow: "0 4px 14px rgba(219, 39, 119, 0.08)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <span style={{ fontSize: "1.8rem" }}>🛡️</span>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#9d174d" }}>
                                    Women Safety Platform Metrics
                                </h2>
                                <p style={{ margin: "2px 0 0", color: "#831843", fontSize: "0.88rem" }}>
                                    Live tracking of female rider preferences and male driver consent.
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                gap: "16px",
                            }}
                        >
                            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #fbcfe8" }}>
                                <div style={{ color: "#9d174d", fontSize: "0.85rem", fontWeight: 600 }}>Total Women-Safety Rides</div>
                                <strong style={{ fontSize: "1.6rem", color: "#831843" }}>{stats?.womenSafety?.total || 0}</strong>
                            </div>

                            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #fbcfe8" }}>
                                <div style={{ color: "#166534", fontSize: "0.85rem", fontWeight: 600 }}>Female Drivers Assigned</div>
                                <strong style={{ fontSize: "1.6rem", color: "#15803d" }}>{stats?.womenSafety?.femaleDriversAssigned || 0}</strong>
                            </div>

                            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #fbcfe8" }}>
                                <div style={{ color: "#c2410c", fontSize: "0.85rem", fontWeight: 600 }}>Male Consent Pending</div>
                                <strong style={{ fontSize: "1.6rem", color: "#ea580c" }}>{stats?.womenSafety?.maleDriverConsentPending || 0}</strong>
                            </div>

                            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #fbcfe8" }}>
                                <div style={{ color: "#1e40af", fontSize: "0.85rem", fontWeight: 600 }}>Male Consent Granted</div>
                                <strong style={{ fontSize: "1.6rem", color: "#2563eb" }}>{stats?.womenSafety?.maleDriverConsentAccepted || 0}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Quick Management Links */}
                    <div className="quick-grid">
                        <Link to="/admin/bookings" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>📋</span>
                            <strong>Manage Bookings</strong>
                            <small>Inspect rides, fares, and women-safety status</small>
                        </Link>
                        <Link to="/admin/drivers" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>🚗</span>
                            <strong>Manage Drivers</strong>
                            <small>Review, approve, or reject driver applications</small>
                        </Link>
                        <Link to="/admin/users" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>👥</span>
                            <strong>Manage Users</strong>
                            <small>View and manage registered riders and drivers</small>
                        </Link>
                        <Link to="/admin/vehicles" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>🚘</span>
                            <strong>Manage Vehicles</strong>
                            <small>Inspect registered vehicles and types</small>
                        </Link>
                        <Link to="/admin/payments" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>💳</span>
                            <strong>Manage Payments</strong>
                            <small>View transaction records</small>
                        </Link>
                        <Link to="/admin/reports" className="quick-card">
                            <span style={{ fontSize: "2rem" }}>⚠️</span>
                            <strong>Reports & Safety</strong>
                            <small>Review user reports and disputes</small>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

const Stat = ({ icon, title, value }) => (
    <div
        className="stat-card"
        style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "20px",
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            border: "1px solid #f3f4f6",
        }}
    >
        <div style={{ fontSize: "2.2rem" }}>{icon}</div>
        <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>{title}</div>
            <strong style={{ fontSize: "1.5rem", color: "#111827" }}>{value}</strong>
        </div>
    </div>
);

export default AdminDashboard;