import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import GoogleMap from "../../components/GoogleMap";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
    const [consentLoading, setConsentLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);

    const loadBooking = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await api.get(`/bookings/${id}`);
            setBooking(res.data.data);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load booking details");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadBooking();
        // Poll every 4 seconds for real-time driver assignment and status updates
        const interval = setInterval(() => {
            loadBooking(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [id]);

    const handlePayDemo = async (paymentMethod = "upi") => {
        try {
            setPayLoading(true);
            setActionMsg({ type: "", text: "" });
            const res = await api.post(`/payments/booking/${id}/pay`, {
                paymentMethod,
            });
            setBooking(res.data.data.booking);
            setActionMsg({
                type: "success",
                text: res.data.message || "Payment completed successfully!",
            });
        } catch (err) {
            setActionMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to process payment",
            });
        } finally {
            setPayLoading(false);
        }
    };

    const handleConsent = async (consent) => {
        try {
            setConsentLoading(true);
            setActionMsg({ type: "", text: "" });
            const res = await api.patch(`/bookings/${id}/women-driver-consent`, {
                consent,
            });
            setBooking(res.data.data);
            setActionMsg({
                type: "success",
                text: res.data.message || `Consent recorded: ${consent}`,
            });
        } catch (err) {
            setActionMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to update driver consent",
            });
        } finally {
            setConsentLoading(false);
        }
    };

    const handleCancel = async () => {
        const reason = window.prompt("Please provide a reason for cancellation (optional):", "Plans changed");
        if (reason === null) return; // User cancelled prompt

        try {
            setCancelLoading(true);
            const res = await api.patch(`/bookings/${id}/status`, {
                status: "cancelled",
                cancellationReason: reason || "Cancelled by rider",
            });
            setBooking(res.data.data);
            setActionMsg({
                type: "success",
                text: "Booking has been cancelled.",
            });
        } catch (err) {
            setActionMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to cancel booking",
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isFemale = user?.gender?.toLowerCase() === "female" || booking?.user?.gender?.toLowerCase() === "female";

    if (loading) {
        return (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
                <h3>Loading booking details...</h3>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
                <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
                    {error || "Booking not found"}
                </div>
                <Link to="/rider/bookings" className="btn btn-primary">
                    ← Back to My Bookings
                </Link>
            </div>
        );
    }

    const pickupCoord = {
        lat: Number(booking.pickupLatitude),
        lng: Number(booking.pickupLongitude),
    };
    const dropCoord = {
        lat: Number(booking.dropLatitude),
        lng: Number(booking.dropLongitude),
    };

    return (
        <APIProvider
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["places"]}
            region="IN"
            language="en"
        >
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Booking Details</h1>
                            <span className={`status status-${booking.status}`} style={{ fontSize: "0.9rem", textTransform: "uppercase", fontWeight: 700 }}>
                                {booking.status?.replace("_", " ")}
                            </span>
                        </div>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
                            ID: <strong style={{ color: "#111827" }}>{booking._id}</strong> • Booked on {formatDateTime(booking.createdAt)}
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <Link to="/rider/bookings" className="btn" style={{ background: "#f3f4f6", color: "#374151" }}>
                            ← My Bookings
                        </Link>
                        {["pending", "accepted"].includes(booking.status) && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelLoading}
                                className="btn"
                                style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}
                            >
                                {cancelLoading ? "Cancelling..." : "Cancel Ride"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Alerts */}
                {actionMsg.text && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            marginBottom: "20px",
                            background: actionMsg.type === "success" ? "#dcfce7" : "#fee2e2",
                            color: actionMsg.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${actionMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                            fontWeight: 500,
                        }}
                    >
                        {actionMsg.text}
                    </div>
                )}

                {/* WOMEN SAFETY SECTION */}
                {booking.womenSafety && (
                    <div
                        style={{
                            marginBottom: "24px",
                            padding: "18px 20px",
                            background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
                            border: "1px solid #fbcfe8",
                            borderRadius: "14px",
                            boxShadow: "0 2px 8px rgba(219, 39, 119, 0.08)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
                            <strong style={{ fontSize: "1.1rem", color: "#9d174d" }}>
                                Women Safety Protected Ride
                            </strong>
                            <span
                                style={{
                                    background: "#f472b6",
                                    color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Female Driver First
                            </span>
                        </div>

                        {/* Case A: Female Driver Assigned */}
                        {booking.driver && booking.driver.user?.gender === "female" && (
                            <p style={{ margin: "4px 0 0", color: "#831843", fontSize: "0.95rem" }}>
                                ✓ <strong>Female Driver Assigned:</strong> Your ride is confirmed with driver <strong>{booking.driver.user.name}</strong>.
                            </p>
                        )}

                        {/* Case B: Female Driver Unavailable - Male Consent Pending */}
                        {!booking.driver && booking.maleDriverConsent === "pending" && (
                            <div style={{ marginTop: "12px", padding: "16px", background: "#ffffff", borderRadius: "10px", border: "1px solid #f472b6" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontWeight: 700, fontSize: "1rem" }}>
                                    <span>⚠️</span> Female Driver Unavailable
                                </div>
                                <p style={{ margin: "8px 0 16px", color: "#374151", fontSize: "0.95rem", lineHeight: "1.5" }}>
                                    We could not find an available female driver for your scheduled time. Would you like to allow an approved male driver for this ride?
                                </p>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleConsent("accepted")}
                                        disabled={consentLoading}
                                        style={{
                                            padding: "10px 20px",
                                            background: "#16a34a",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                                        }}
                                    >
                                        {consentLoading ? "Updating..." : "✓ Allow Male Driver"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleConsent("declined")}
                                        disabled={consentLoading}
                                        style={{
                                            padding: "10px 20px",
                                            background: "#f3f4f6",
                                            color: "#374151",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Keep Female Driver Preference
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Case C: Male Consent Declined */}
                        {booking.maleDriverConsent === "declined" && (
                            <div style={{ marginTop: "10px", padding: "12px 14px", background: "#ffffff", borderRadius: "8px", border: "1px solid #fbcfe8", color: "#9d174d", fontSize: "0.95rem" }}>
                                ℹ️ You chose to keep your female driver preference. A male driver will <strong>not</strong> be assigned. Waiting for an available female driver.
                            </div>
                        )}

                        {/* Case D: Male Consent Accepted */}
                        {booking.maleDriverConsent === "accepted" && booking.driver?.user?.gender === "male" && (
                            <div style={{ marginTop: "10px", padding: "12px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.95rem" }}>
                                ✓ You allowed a male driver. Approved driver <strong>{booking.driver.user.name}</strong> is assigned.
                            </div>
                        )}
                    </div>
                )}

                {/* Main Grid: Details Left, Map Right */}
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "24px" }}>
                    {/* Left Column: Trip & Driver Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Trip Summary Card */}
                        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "1.15rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                                📍 Trip Details
                            </h3>

                            {/* Scheduled Time Banner */}
                            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                                    Scheduled Ride Time
                                </div>
                                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                                    🕒 {formatDateTime(booking.bookingDate)}
                                </div>
                            </div>

                            {/* Pickup & Drop */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>🟢</span>
                                    <div>
                                        <small style={{ color: "#6b7280", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700 }}>Pickup Location</small>
                                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{booking.pickupLocation}</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>🔴</span>
                                    <div>
                                        <small style={{ color: "#6b7280", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700 }}>Destination</small>
                                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{booking.dropLocation}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row: Vehicle, Distance, Duration, Fare */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", background: "#f9fafb", padding: "12px", borderRadius: "10px" }}>
                                <div style={{ textAlign: "center" }}>
                                    <small style={{ color: "#6b7280", fontSize: "0.75rem" }}>Vehicle</small>
                                    <div style={{ fontWeight: 700, textTransform: "capitalize", fontSize: "0.95rem" }}>
                                        {booking.vehicleType === "bike" ? "🏍️ Bike" : booking.vehicleType === "auto" ? "🛺 Auto" : "🚗 Car"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <small style={{ color: "#6b7280", fontSize: "0.75rem" }}>Distance</small>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{booking.distanceKm} km</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <small style={{ color: "#6b7280", fontSize: "0.75rem" }}>Est. Time</small>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{booking.durationMinutes} mins</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <small style={{ color: "#6b7280", fontSize: "0.75rem" }}>Total Fare</small>
                                    <div style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.1rem" }}>₹{booking.fare}</div>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info Card */}
                        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: "1.15rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                                🚗 Driver Information
                            </h3>

                            {booking.driver ? (
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <div>
                                            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>
                                                {booking.driver.user?.name || "Driver"}
                                            </div>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "2px" }}>
                                                Gender: <strong style={{ textTransform: "capitalize" }}>{booking.driver.user?.gender || "—"}</strong> • Rating: ⭐ {booking.driver.rating || "5.0"}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: "2rem" }}>
                                            {booking.driver.user?.gender === "female" ? "👩‍✈️" : "👨‍✈️"}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.9rem", color: "#4b5563", background: "#f9fafb", padding: "10px 12px", borderRadius: "8px" }}>
                                        <div>📞 Phone: <strong>{booking.driver.user?.phone || "—"}</strong></div>
                                        <div>🪪 License: <strong>{booking.driver.licenseNumber || "Verified"}</strong></div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
                                    <strong style={{ color: "#374151" }}>Searching for an eligible driver...</strong>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                                        We are checking driver schedules and availability. Your ride will update automatically.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Payment Details & Actions Card */}
                        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" }}>
                                <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                                    💳 Payment Information
                                </h3>
                                <span
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        background: booking.paymentStatus === "completed" ? "#dcfce7" : "#fef3c7",
                                        color: booking.paymentStatus === "completed" ? "#15803d" : "#b45309",
                                    }}
                                >
                                    ● {booking.paymentStatus === "completed" ? "Paid" : "Payment Pending"}
                                </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Method: <strong style={{ textTransform: "uppercase", color: "#111827" }}>{booking.paymentMethod || "Cash"}</strong></div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Fare Amount: <strong style={{ color: "#16a34a", fontSize: "1.1rem" }}>₹{booking.fare}</strong></div>
                                </div>
                            </div>

                            {/* Case A: Payment Completed */}
                            {booking.paymentStatus === "completed" ? (
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "10px", color: "#166534", fontSize: "0.95rem" }}>
                                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                        ✓ Payment Successful
                                    </div>
                                    <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "#15803d" }}>
                                        Amount of ₹{booking.fare} has been paid via {booking.paymentMethod?.toUpperCase()}.
                                    </div>
                                </div>
                            ) : (
                                /* Case B: Payment Pending - Show Payment Options / QR */
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px" }}>
                                    {booking.paymentMethod === "upi" && (
                                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>
                                                Scan UPI QR Code to Pay
                                            </div>
                                            <div style={{ display: "inline-block", padding: "8px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=ridebook@upi%26pn=RideBook%26am=${booking.fare}%26cu=INR`}
                                                    alt="UPI QR Code"
                                                    style={{ width: "160px", height: "160px", display: "block" }}
                                                />
                                            </div>
                                            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "8px" }}>
                                                UPI ID: <code style={{ fontWeight: 700, color: "#0f172a" }}>ridebook@upi</code>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <button
                                            type="button"
                                            disabled={payLoading}
                                            onClick={() => handlePayDemo("upi")}
                                            className="btn btn-primary"
                                            style={{ width: "100%", padding: "10px", fontWeight: 700 }}
                                        >
                                            {payLoading ? "Processing Payment..." : `Pay ₹${booking.fare} via UPI (Demo)`}
                                        </button>

                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                type="button"
                                                disabled={payLoading}
                                                onClick={() => handlePayDemo("card")}
                                                className="btn"
                                                style={{ flex: 1, padding: "8px", background: "#ffffff", border: "1px solid #d1d5db", color: "#374151", fontWeight: 600 }}
                                            >
                                                Pay by Card (Demo)
                                            </button>
                                            <button
                                                type="button"
                                                disabled={payLoading}
                                                onClick={() => handlePayDemo("cash")}
                                                className="btn"
                                                style={{ flex: 1, padding: "8px", background: "#ffffff", border: "1px solid #d1d5db", color: "#374151", fontWeight: 600 }}
                                            >
                                                Mark Cash Paid
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Route Map */}
                    <div style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", height: "fit-content" }}>
                        <div style={{ marginBottom: "12px", fontWeight: 600, color: "#374151" }}>
                            🗺️ Route Map
                        </div>
                        <GoogleMap
                            pickup={pickupCoord}
                            destination={dropCoord}
                            routePolyline={booking.routePolyline}
                        />
                    </div>
                </div>
            </div>
        </APIProvider>
    );
};

export default BookingDetails;
