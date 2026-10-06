import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import GoogleMap from "../../components/GoogleMap";
import LocationSearch from "../../components/LocationSearch";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function BookRide() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Location Text
    const [pickupText, setPickupText] = useState("");
    const [destinationText, setDestinationText] = useState("");

    // Location Coordinates
    const [pickup, setPickup] = useState(null);
    const [destination, setDestination] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);

    // Ride options
    const [vehicleType, setVehicleType] = useState("car");

    // 3-Day Advance Booking Date/Time
    const getMinMaxDates = () => {
        const now = new Date();
        const minStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        const maxDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const maxStr = new Date(
            maxDate.getTime() - maxDate.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);
        return { minStr, maxStr, defaultStr: minStr };
    };

    const { minStr, maxStr, defaultStr } = getMinMaxDates();
    const [bookingDate, setBookingDate] = useState(defaultStr);

    // Route / Fare
    const [route, setRoute] = useState(null);
    const [fare, setFare] = useState(null);

    // Payment Method
    const [paymentMethod, setPaymentMethod] = useState("cash");

    // Created Booking State
    const [booking, setBooking] = useState(null);

    // Loading & Messages
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [consentLoading, setConsentLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Detect user gender for Women Safety
    const isFemale = user?.gender?.toLowerCase() === "female";

    // Fetch current GPS location
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            (err) => console.warn("Geolocation warning:", err.message),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }, []);

    // Quick Schedule Helper
    const setQuickDate = (daysAhead, hour = null, minute = null) => {
        const target = new Date();
        target.setDate(target.getDate() + daysAhead);
        if (hour !== null) target.setHours(hour);
        if (minute !== null) target.setMinutes(minute);
        const str = new Date(
            target.getTime() - target.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);
        setBookingDate(str);
    };

    // Pickup Selected from Google Places
    const handlePickupSelected = useCallback((location) => {
        if (!location) {
            setPickup(null);
            setRoute(null);
            setFare(null);
            return;
        }

        setPickup({
            address: location.address,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            placeId: location.placeId || null,
        });
        setPickupText(location.address);
        setRoute(null);
        setFare(null);
        setError("");
    }, []);

    // Destination Selected from Google Places
    const handleDestinationSelected = useCallback((location) => {
        if (!location) {
            setDestination(null);
            setRoute(null);
            setFare(null);
            return;
        }

        setDestination({
            address: location.address,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            placeId: location.placeId || null,
        });
        setDestinationText(location.address);
        setRoute(null);
        setFare(null);
        setError("");
    }, []);

    // Use Current GPS Location
    const useCurrentLocation = () => {
        if (!currentLocation) {
            setError("Current location is not available from your browser.");
            return;
        }

        const location = {
            address: "My Current Location",
            latitude: Number(currentLocation.latitude),
            longitude: Number(currentLocation.longitude),
        };

        setPickup(location);
        setPickupText("My Current Location");
        setRoute(null);
        setFare(null);
        setError("");
        setSuccess("Current location selected as pickup.");
    };

    // Calculate Route & Fare
    const calculateRouteAndFare = async () => {
        setError("");
        setSuccess("");

        if (!pickup) {
            if (pickupText && pickupText.trim()) {
                setError("Please select a pickup location from Google suggestions.");
            } else {
                setError("Please enter and select a pickup location from Google suggestions.");
            }
            return;
        }

        if (!destination) {
            if (destinationText && destinationText.trim()) {
                setError("Please select a destination from Google suggestions.");
            } else {
                setError("Please enter and select a destination from Google suggestions.");
            }
            return;
        }

        try {
            setLoadingRoute(true);
            const response = await api.post("/bookings/route-preview", {
                pickupLatitude: pickup.latitude,
                pickupLongitude: pickup.longitude,
                dropLatitude: destination.latitude,
                dropLongitude: destination.longitude,
                vehicleType,
            });

            const data = response.data;
            if (!data.success) {
                throw new Error(data.message || "Failed to calculate route");
            }

            setRoute(data.route);
            setFare(data.fare);
            setSuccess("Route and fare calculated successfully.");
        } catch (err) {
            console.error("Route calculation error:", err);
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Unable to calculate route. Please try again."
            );
        } finally {
            setLoadingRoute(false);
        }
    };

    // Automatically recalculate if vehicle changes and route was already calculated
    const handleVehicleChange = (newType) => {
        setVehicleType(newType);
        if (pickup && destination) {
            setRoute(null);
            setFare(null);
        }
    };

    // Create Booking
    const handleCreateBooking = async () => {
        if (bookingLoading) return;

        setError("");
        setSuccess("");

        if (!pickup) {
            setError("Please select a pickup location from Google suggestions.");
            return;
        }

        if (!destination) {
            setError("Please select a destination from Google suggestions.");
            return;
        }

        // Validate 3-day rule on client before submit
        const selectedTime = new Date(bookingDate).getTime();
        const nowTime = Date.now();
        if (selectedTime < nowTime - 5 * 60 * 1000) {
            setError("Scheduled ride time cannot be in the past.");
            return;
        }
        if (selectedTime > nowTime + 3 * 24 * 60 * 60 * 1000 + 60 * 1000) {
            setError("Rides can only be scheduled up to 3 days (72 hours) in advance.");
            return;
        }

        try {
            setBookingLoading(true);

            const response = await api.post("/bookings", {
                pickupLocation: pickup.address,
                pickupLatitude: pickup.latitude,
                pickupLongitude: pickup.longitude,
                dropLocation: destination.address,
                dropLatitude: destination.latitude,
                dropLongitude: destination.longitude,
                bookingDate,
                vehicleType,
                paymentMethod,
            });

            const data = response.data;
            const newBooking = data.data;
            setBooking(newBooking);

            // If female rider and consent is pending, show consent prompt directly on page
            if (data.womenSafety?.maleDriverConsent === "pending") {
                setSuccess(
                    "No female driver is currently available for this scheduled time. Would you like to allow an approved male driver?"
                );
            } else {
                setSuccess(data.message || "Ride booked successfully!");
                // Navigate to booking details after 1.5s
                setTimeout(() => {
                    navigate(`/rider/bookings/${newBooking._id}`);
                }, 1500);
            }
        } catch (err) {
            console.error("Booking error:", err);
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to create booking."
            );
        } finally {
            setBookingLoading(false);
        }
    };

    // Handle Male Driver Consent
    const handleConsent = async (consent) => {
        if (!booking?._id) return;

        try {
            setConsentLoading(true);
            setError("");
            const res = await api.patch(
                `/bookings/${booking._id}/women-driver-consent`,
                { consent }
            );
            setBooking(res.data.data);
            setSuccess(res.data.message);

            setTimeout(() => {
                navigate(`/rider/bookings/${booking._id}`);
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to update driver consent"
            );
        } finally {
            setConsentLoading(false);
        }
    };

    return (
        <APIProvider
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["places"]}
            region="IN"
            language="en"
        >
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
                {/* Header */}
                <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ margin: "0 0 6px", fontSize: "1.9rem", color: "#111827" }}>
                        Book a Ride
                    </h1>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        Instant cab booking & advance scheduling up to 3 days.
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "16px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: "10px",
                            border: "1px solid #fecaca",
                            fontWeight: 500,
                        }}
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "16px",
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: "10px",
                            border: "1px solid #bbf7d0",
                            fontWeight: 500,
                        }}
                    >
                        {success}
                    </div>
                )}

                {/* Main 2-Column Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1.4fr",
                        gap: "24px",
                        alignItems: "start",
                    }}
                >
                    {/* Left Column: Form Controls */}
                    <div
                        style={{
                            background: "#ffffff",
                            padding: "24px",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            border: "1px solid #f3f4f6",
                        }}
                    >
                        {/* Women Safety Notification for Female Riders */}
                        {isFemale && (
                            <div
                                style={{
                                    padding: "14px 16px",
                                    marginBottom: "18px",
                                    background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
                                    border: "1px solid #fbcfe8",
                                    borderRadius: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9d174d", fontWeight: 700 }}>
                                    <span>🛡️</span> Women Safety Active
                                </div>
                                <p style={{ margin: "4px 0 0", color: "#831843", fontSize: "0.88rem" }}>
                                    An eligible <strong>female driver</strong> will be automatically prioritized for your ride.
                                </p>
                            </div>
                        )}

                        {/* Pickup Location */}
                        <div style={{ marginBottom: "12px" }}>
                            <LocationSearch
                                label="📍 Pickup Location"
                                placeholder="Search pickup address or landmark"
                                value={pickupText}
                                onChange={(val) => {
                                    setPickupText(val);
                                    setPickup(null);
                                    setRoute(null);
                                    setFare(null);
                                }}
                                onLocationSelected={handlePickupSelected}
                            />
                        </div>

                        {/* Current Location Button */}
                        {currentLocation && (
                            <button
                                type="button"
                                onClick={useCurrentLocation}
                                style={{
                                    width: "100%",
                                    marginBottom: "16px",
                                    padding: "9px 12px",
                                    border: "1px dashed #cbd5e1",
                                    borderRadius: "8px",
                                    background: "#f8fafc",
                                    color: "#334155",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                }}
                            >
                                🎯 Use My Current Location
                            </button>
                        )}

                        {/* Destination Location */}
                        <div style={{ marginBottom: "16px" }}>
                            <LocationSearch
                                label="🏁 Destination Location"
                                placeholder="Search drop address or destination"
                                value={destinationText}
                                onChange={(val) => {
                                    setDestinationText(val);
                                    setDestination(null);
                                    setRoute(null);
                                    setFare(null);
                                }}
                                onLocationSelected={handleDestinationSelected}
                            />
                        </div>

                        {/* Vehicle Type Selection Cards */}
                        <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.95rem" }}>
                            Select Vehicle Type
                        </label>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "10px",
                                marginBottom: "18px",
                            }}
                        >
                            {[
                                { type: "bike", name: "Bike", icon: "🏍️", desc: "Fast & single rider", base: "₹30 + ₹10/km" },
                                { type: "auto", name: "Auto", icon: "🛺", desc: "Economical & comfy", base: "₹40 + ₹14/km" },
                                { type: "car", name: "Car", icon: "🚗", desc: "AC & spacious", base: "₹70 + ₹18/km" },
                            ].map((v) => (
                                <div
                                    key={v.type}
                                    onClick={() => handleVehicleChange(v.type)}
                                    style={{
                                        padding: "12px 10px",
                                        borderRadius: "10px",
                                        border: vehicleType === v.type ? "2px solid #16a34a" : "1px solid #e5e7eb",
                                        background: vehicleType === v.type ? "#f0fdf4" : "#ffffff",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <div style={{ fontSize: "1.6rem", marginBottom: "4px" }}>{v.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: vehicleType === v.type ? "#166534" : "#111827" }}>
                                        {v.name}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "2px" }}>
                                        {v.base}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3-DAY ADVANCE BOOKING PICKER */}
                        <div
                            style={{
                                padding: "14px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                marginBottom: "18px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <label style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b", margin: 0 }}>
                                    📅 Schedule Ride Date & Time
                                </label>
                                <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                                    Up to 3 Days in Advance
                                </span>
                            </div>

                            {/* Quick Day Selector Buttons */}
                            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => setQuickDate(0)}
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDate(1, 9, 0)}
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}
                                >
                                    Tomorrow (09:00 AM)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDate(2, 10, 0)}
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}
                                >
                                    +2 Days (10:00 AM)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDate(3, 11, 0)}
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: "pointer" }}
                                >
                                    +3 Days (11:00 AM)
                                </button>
                            </div>

                            <input
                                type="datetime-local"
                                min={minStr}
                                max={maxStr}
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    boxSizing: "border-box",
                                    fontSize: "0.95rem",
                                    fontWeight: 500,
                                }}
                            />
                            <small style={{ color: "#64748b", fontSize: "0.78rem", display: "block", marginTop: "4px" }}>
                                Note: Bookings allowed for today or any time within the next 72 hours.
                            </small>
                        </div>

                        {/* Calculate Route & Fare Button */}
                        <button
                            type="button"
                            onClick={calculateRouteAndFare}
                            disabled={loadingRoute}
                            style={{
                                width: "100%",
                                padding: "13px",
                                border: "none",
                                borderRadius: "10px",
                                background: "#1e293b",
                                color: "#ffffff",
                                fontSize: "1rem",
                                fontWeight: 600,
                                cursor: loadingRoute ? "not-allowed" : "pointer",
                                opacity: loadingRoute ? 0.7 : 1,
                                marginBottom: route ? "14px" : "0",
                            }}
                        >
                            {loadingRoute ? "Calculating Road Route..." : "🔍 Calculate Route & Fare"}
                        </button>

                        {/* Route Summary & Confirm Booking Card */}
                        {route && (
                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "20px",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "14px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                                }}
                            >
                                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "14px" }}>
                                    📋 Trip Summary
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem", color: "#475569", marginBottom: "16px" }}>
                                    <div>
                                        <strong style={{ color: "#1e293b" }}>📍 Pickup: </strong>
                                        {pickup?.address}
                                    </div>
                                    <div>
                                        <strong style={{ color: "#1e293b" }}>🏁 Destination: </strong>
                                        {destination?.address}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", marginTop: "4px" }}>
                                        <span><strong style={{ color: "#1e293b" }}>📏 Distance:</strong> {route.distanceKm} km</span>
                                        <span><strong style={{ color: "#1e293b" }}>⏱️ Duration:</strong> {route.durationMinutes} min</span>
                                        <span><strong style={{ color: "#1e293b" }}>🚗 Vehicle:</strong> {vehicleType.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", marginBottom: "16px" }}>
                                    <span style={{ fontSize: "1rem", color: "#166534", fontWeight: 600 }}>Total Estimated Fare</span>
                                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d" }}>₹{fare}</span>
                                </div>

                                {/* Schedule Date & Time summary */}
                                <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#f1f5f9", borderRadius: "8px", fontSize: "0.88rem", color: "#334155" }}>
                                    <strong>🗓️ Scheduled For: </strong> {new Date(bookingDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                </div>

                                {/* Women Safety Status */}
                                {isFemale && (
                                    <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: "8px", fontSize: "0.88rem", color: "#be185d" }}>
                                        <strong>🛡️ Women Safety: </strong> A verified female driver will be prioritized first for this ride.
                                    </div>
                                )}

                                {/* Payment Method Selection */}
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, color: "#1e293b", marginBottom: "10px" }}>
                                        💳 Payment Method:
                                    </label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cash")}
                                            style={{
                                                padding: "12px 8px",
                                                borderRadius: "10px",
                                                border: `2px solid ${paymentMethod === "cash" ? "#16a34a" : "#cbd5e1"}`,
                                                background: paymentMethod === "cash" ? "#f0fdf4" : "#ffffff",
                                                cursor: "pointer",
                                                textAlign: "center",
                                                fontWeight: 600,
                                                color: paymentMethod === "cash" ? "#166534" : "#475569",
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            💵 Cash
                                            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400, marginTop: "2px" }}>Default (Pay Driver)</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("upi")}
                                            style={{
                                                padding: "12px 8px",
                                                borderRadius: "10px",
                                                border: `2px solid ${paymentMethod === "upi" ? "#2563eb" : "#cbd5e1"}`,
                                                background: paymentMethod === "upi" ? "#eff6ff" : "#ffffff",
                                                cursor: "pointer",
                                                textAlign: "center",
                                                fontWeight: 600,
                                                color: paymentMethod === "upi" ? "#1d4ed8" : "#475569",
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            📱 Google Pay / UPI
                                            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400, marginTop: "2px" }}>UPI / GPay Selection</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("card")}
                                            style={{
                                                padding: "12px 8px",
                                                borderRadius: "10px",
                                                border: `2px solid ${paymentMethod === "card" ? "#7c3aed" : "#cbd5e1"}`,
                                                background: paymentMethod === "card" ? "#f5f3ff" : "#ffffff",
                                                cursor: "pointer",
                                                textAlign: "center",
                                                fontWeight: 600,
                                                color: paymentMethod === "card" ? "#6d28d9" : "#475569",
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            💳 Card
                                            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400, marginTop: "2px" }}>Debit / Credit Selection</div>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCreateBooking}
                                    disabled={bookingLoading}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        border: "none",
                                        borderRadius: "10px",
                                        background: "#16a34a",
                                        color: "#ffffff",
                                        fontSize: "1.05rem",
                                        fontWeight: 700,
                                        cursor: bookingLoading ? "not-allowed" : "pointer",
                                        boxShadow: "0 3px 10px rgba(22, 163, 74, 0.3)",
                                    }}
                                >
                                    {bookingLoading ? "Confirming Booking..." : "✓ Confirm Booking"}
                                </button>
                            </div>
                        )}

                        {/* Male Driver Consent Modal Card on this page if pending */}
                        {isFemale && booking?.maleDriverConsent === "pending" && (
                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "18px",
                                    background: "#fff7ed",
                                    border: "1px solid #fdba74",
                                    borderRadius: "12px",
                                }}
                            >
                                <div style={{ color: "#c2410c", fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>
                                    ⚠️ Female Driver Unavailable
                                </div>
                                <p style={{ margin: "0 0 14px", color: "#431407", fontSize: "0.92rem", lineHeight: "1.4" }}>
                                    No verified female driver is currently available at your selected time. Would you like to allow an approved male driver for this ride?
                                </p>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleConsent("accepted")}
                                        disabled={consentLoading}
                                        style={{
                                            padding: "10px 16px",
                                            background: "#16a34a",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {consentLoading ? "Updating..." : "✓ Allow Male Driver"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleConsent("declined")}
                                        disabled={consentLoading}
                                        style={{
                                            padding: "10px 16px",
                                            background: "#ffffff",
                                            color: "#374151",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Keep Female Preference
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Google Map */}
                    <div
                        style={{
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            border: "1px solid #f3f4f6",
                        }}
                    >
                        <div style={{ fontWeight: 600, color: "#374151", marginBottom: "12px" }}>
                            🗺️ Interactive Route Map
                        </div>
                        <GoogleMap
                            pickup={
                                pickup
                                    ? {
                                          lat: pickup.latitude,
                                          lng: pickup.longitude,
                                      }
                                    : null
                            }
                            destination={
                                destination
                                    ? {
                                          lat: destination.latitude,
                                          lng: destination.longitude,
                                      }
                                    : null
                            }
                            routePolyline={route?.encodedPolyline || null}
                        />
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}

export default BookRide;