import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const MyRides = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState("assigned"); // 'assigned' | 'available'
    const [assignedRides, setAssignedRides] = useState([]);
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const loadRides = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [assignedRes, pendingRes] = await Promise.all([
                api.get("/bookings"),
                api.get("/bookings/driver/pending"),
            ]);

            setAssignedRides(assignedRes.data.data || []);
            setAvailableRides(pendingRes.data.data || []);
        } catch (err) {
            console.error("Load rides error:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadRides();
        const interval = setInterval(() => {
            loadRides(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [user]);

    // Accept Available Ride
    const handleAcceptRide = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            setMessage({ type: "", text: "" });
            const res = await api.patch(`/bookings/driver/accept/${bookingId}`);
            setMessage({
                type: "success",
                text: res.data.message || "Ride accepted successfully!",
            });
            await loadRides(true);
            setTab("assigned");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to accept ride",
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Pass on (reject) an Available Ride request — hides it from the driver's list
    const handlePassRide = async (bookingId) => {
        try {
            setActionLoading(bookingId + "_pass");
            await api.patch(`/bookings/driver/reject/${bookingId}`);
            await loadRides(true);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to pass on ride",
            });
        } finally {
            setActionLoading(null);
        }
    };


    // Update Ride Lifecycle Status
    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            setActionLoading(bookingId);
            setMessage({ type: "", text: "" });

            let reason = null;
            if (newStatus === "cancelled") {
                reason = window.prompt("Reason for cancellation:", "Driver unavailable");
                if (reason === null) return;
            }

            const res = await api.patch(`/bookings/${bookingId}/status`, {
                status: newStatus,
                cancellationReason: reason,
            });

            setMessage({
                type: "success",
                text: res.data.message || `Status updated to ${newStatus}`,
            });
            await loadRides(true);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to update status",
            });
        } finally {
            setActionLoading(null);
        }
    };

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
            {/* Header */}
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "1.8rem" }}>My Rides & Requests</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Manage your assigned trips and accept new passenger requests.
                </p>
            </div>

            {/* Alert Message */}
            {message.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "16px",
                        borderRadius: "10px",
                        background: message.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: message.type === "success" ? "#166534" : "#991b1b",
                        border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        fontWeight: 600,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button
                    onClick={() => setTab("assigned")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background: tab === "assigned" ? "#111827" : "#f3f4f6",
                        color: tab === "assigned" ? "#ffffff" : "#374151",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>🚕</span> Assigned Rides ({assignedRides.length})
                </button>

                <button
                    onClick={() => setTab("available")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background: tab === "available" ? "#16a34a" : "#f3f4f6",
                        color: tab === "available" ? "#ffffff" : "#374151",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>⚡</span> Available Requests ({availableRides.length})
                </button>
            </div>

            {/* Content Card */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Loading rides...
                </div>
            ) : tab === "assigned" ? (
                /* TAB 1: ASSIGNED RIDES */
                assignedRides.length === 0 ? (
                    <div style={{ background: "#ffffff", padding: "40px", borderRadius: "14px", textAlign: "center", border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🚕</div>
                        <h3>No assigned rides</h3>
                        <p style={{ color: "#6b7280" }}>You do not have any accepted or upcoming rides right now.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {assignedRides.map((ride) => (
                            <div
                                key={ride._id}
                                style={{
                                    background: "#ffffff",
                                    padding: "20px",
                                    borderRadius: "14px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                    border: "1px solid #f3f4f6",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <strong style={{ fontSize: "1.05rem" }}>🕒 {formatDateTime(ride.bookingDate)}</strong>
                                        {ride.womenSafety && (
                                            <span style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                                                🛡️ Women Safety
                                            </span>
                                        )}
                                    </div>
                                    <span className={`status status-${ride.status}`} style={{ textTransform: "uppercase", fontWeight: 700 }}>
                                        {ride.status?.replace("_", " ")}
                                    </span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr", gap: "16px", alignItems: "center" }}>
                                    <div>
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                                            <span>🟢</span>
                                            <strong style={{ fontSize: "0.92rem", color: "#1f2937" }}>{ride.pickupLocation}</strong>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <span>🔴</span>
                                            <strong style={{ fontSize: "0.92rem", color: "#1f2937" }}>{ride.dropLocation}</strong>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 600, color: "#111827" }}>
                                            Rider: {ride.user?.name || "Passenger"}
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                            📞 {ride.user?.phone || "—"}
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 700, marginTop: "2px" }}>
                                            Fare: ₹{ride.fare} ({ride.distanceKm} km)
                                        </div>
                                    </div>

                                    {/* Action Buttons based on status */}
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                        {ride.status === "accepted" && (
                                            <button
                                                onClick={() => handleStatusUpdate(ride._id, "driver_arriving")}
                                                disabled={actionLoading === ride._id}
                                                className="btn btn-primary btn-small"
                                                style={{ background: "#2563eb" }}
                                            >
                                                🚗 Start to Pickup
                                            </button>
                                        )}

                                        {ride.status === "driver_arriving" && (
                                            <button
                                                onClick={() => handleStatusUpdate(ride._id, "driver_arrived")}
                                                disabled={actionLoading === ride._id}
                                                className="btn btn-primary btn-small"
                                                style={{ background: "#7c3aed" }}
                                            >
                                                📍 Arrived at Pickup
                                            </button>
                                        )}

                                        {ride.status === "driver_arrived" && (
                                            <button
                                                onClick={() => handleStatusUpdate(ride._id, "ongoing")}
                                                disabled={actionLoading === ride._id}
                                                className="btn btn-primary btn-small"
                                                style={{ background: "#16a34a" }}
                                            >
                                                ▶️ Start Trip
                                            </button>
                                        )}

                                        {ride.status === "ongoing" && (
                                            <button
                                                onClick={() => handleStatusUpdate(ride._id, "completed")}
                                                disabled={actionLoading === ride._id}
                                                className="btn btn-primary btn-small"
                                                style={{ background: "#15803d" }}
                                            >
                                                🏁 Complete Trip
                                            </button>
                                        )}

                                        {["accepted", "driver_arriving", "driver_arrived"].includes(ride.status) && (
                                            <button
                                                onClick={() => handleStatusUpdate(ride._id, "cancelled")}
                                                disabled={actionLoading === ride._id}
                                                className="btn btn-small"
                                                style={{ background: "#fee2e2", color: "#991b1b" }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* TAB 2: AVAILABLE REQUESTS */
                availableRides.length === 0 ? (
                    <div style={{ background: "#ffffff", padding: "40px", borderRadius: "14px", textAlign: "center", border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚡</div>
                        <h3>No pending ride requests</h3>
                        <p style={{ color: "#6b7280" }}>
                            There are currently no new ride requests matching your availability schedule.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {availableRides.map((req) => (
                            <div
                                key={req._id}
                                style={{
                                    background: "#ffffff",
                                    padding: "20px",
                                    borderRadius: "14px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <strong style={{ fontSize: "1.05rem" }}>🕒 {formatDateTime(req.bookingDate)}</strong>
                                        {req.womenSafety && (
                                            <span style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                                                🛡️ Women Safety • Male Consent Granted
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem" }}>
                                        NEW REQUEST
                                    </span>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: "16px", alignItems: "center" }}>
                                    <div>
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                                            <span>🟢</span>
                                            <strong style={{ fontSize: "0.92rem" }}>{req.pickupLocation}</strong>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <span>🔴</span>
                                            <strong style={{ fontSize: "0.92rem" }}>{req.dropLocation}</strong>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 600 }}>Rider: {req.user?.name || "Passenger"}</div>
                                        <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                                            Vehicle: <strong style={{ textTransform: "capitalize" }}>{req.vehicleType}</strong>
                                        </div>
                                        <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "1.1rem" }}>
                                            ₹{req.fare} ({req.distanceKm} km)
                                        </div>
                                    </div>

                                    <div style={{ textAlign: "right" }}>
                                        <button
                                            onClick={() => handleAcceptRide(req._id)}
                                            disabled={actionLoading === req._id}
                                            className="btn btn-primary"
                                            style={{ padding: "10px 20px", fontWeight: 700 }}
                                        >
                                            {actionLoading === req._id ? "Accepting..." : "✓ Accept Ride"}
                                        </button>
                                        <button
                                            onClick={() => handlePassRide(req._id)}
                                            disabled={actionLoading === req._id + "_pass"}
                                            style={{
                                                padding: "10px 16px",
                                                fontWeight: 700,
                                                borderRadius: "10px",
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                color: "#6b7280",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {actionLoading === req._id + "_pass" ? "..." : "Pass"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default MyRides;