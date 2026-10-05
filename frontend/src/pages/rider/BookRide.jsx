import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    APIProvider,
} from "@vis.gl/react-google-maps";

import GoogleMap from "../../components/GoogleMap";
import LocationSearch from "../../components/LocationSearch";
import api from "../../api/axios";

function BookRide() {
    // =====================================================
    // LOCATION TEXT
    // =====================================================

    const [pickupText, setPickupText] = useState("");
    const [destinationText, setDestinationText] =
        useState("");


    // =====================================================
    // LOCATION COORDINATES
    // =====================================================

    const [pickup, setPickup] = useState(null);
    const [destination, setDestination] = useState(null);

    const [currentLocation, setCurrentLocation] =
        useState(null);


    // =====================================================
    // RIDE
    // =====================================================

    const [vehicleType, setVehicleType] =
        useState("car");

    const [bookingDate, setBookingDate] =
        useState("");


    // =====================================================
    // ROUTE / FARE
    // =====================================================

    const [route, setRoute] = useState(null);
    const [fare, setFare] = useState(null);


    // =====================================================
    // BOOKING
    // =====================================================

    const [booking, setBooking] = useState(null);


    // =====================================================
    // LOADING
    // =====================================================

    const [loadingRoute, setLoadingRoute] =
        useState(false);

    const [bookingLoading, setBookingLoading] =
        useState(false);


    // =====================================================
    // MESSAGES
    // =====================================================

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =====================================================
    // CURRENT LOCATION
    // =====================================================

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude,
                };

                setCurrentLocation(location);
            },

            (locationError) => {
                console.warn(
                    "Current location unavailable:",
                    locationError
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);


    // =====================================================
    // USER
    // =====================================================

    const getLoggedInUser = () => {
        try {
            const storedUser =
                localStorage.getItem("user");

            if (!storedUser) {
                return null;
            }

            return JSON.parse(storedUser);
        } catch {
            return null;
        }
    };

    const user = getLoggedInUser();

    const isFemale =
        user?.gender?.toLowerCase() === "female";


    // =====================================================
    // PICKUP SELECTED FROM GOOGLE
    // =====================================================

    const handlePickupSelected = useCallback(
        (location) => {
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
            setSuccess("");
        },
        []
    );


    // =====================================================
    // DESTINATION SELECTED FROM GOOGLE
    // =====================================================

    const handleDestinationSelected =
        useCallback(
            (location) => {
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
                setSuccess("");
            },
            []
        );


    // =====================================================
    // PICKUP TEXT CHANGE
    // =====================================================

    const handlePickupTextChange = (value) => {
        setPickupText(value);

        // Text changed, so old coordinates are invalid.
        setPickup(null);
        setRoute(null);
        setFare(null);
        setError("");
        setSuccess("");
    };


    // =====================================================
    // DESTINATION TEXT CHANGE
    // =====================================================

    const handleDestinationTextChange = (value) => {
        setDestinationText(value);

        // Text changed, so old coordinates are invalid.
        setDestination(null);
        setRoute(null);
        setFare(null);
        setError("");
        setSuccess("");
    };


    // =====================================================
    // USE CURRENT LOCATION
    // =====================================================

    const useCurrentLocation = () => {
        if (!currentLocation) {
            setError(
                "Current location is not available."
            );

            return;
        }

        const location = {
            address: "Current location",

            latitude:
                Number(currentLocation.latitude),

            longitude:
                Number(currentLocation.longitude),
        };

        setPickup(location);
        setPickupText("Current location");

        setRoute(null);
        setFare(null);
        setError("");

        setSuccess(
            "Current location selected."
        );
    };


    // =====================================================
    // CALCULATE ROUTE + FARE
    // =====================================================

    const calculateRouteAndFare = async () => {
        setError("");
        setSuccess("");

        setRoute(null);
        setFare(null);


        // ---------------------------------------------
        // Pickup validation
        // ---------------------------------------------

        if (!pickup) {
            setError(
                "Please select the pickup location from the Google suggestions."
            );

            return;
        }

        if (
            typeof pickup.latitude !== "number" ||
            typeof pickup.longitude !== "number" ||
            !Number.isFinite(pickup.latitude) ||
            !Number.isFinite(pickup.longitude)
        ) {
            setError(
                "Pickup location does not have valid coordinates."
            );

            return;
        }


        // ---------------------------------------------
        // Destination validation
        // ---------------------------------------------

        if (!destination) {
            setError(
                "Please select the destination from the Google suggestions."
            );

            return;
        }

        if (
            typeof destination.latitude !== "number" ||
            typeof destination.longitude !== "number" ||
            !Number.isFinite(destination.latitude) ||
            !Number.isFinite(destination.longitude)
        ) {
            setError(
                "Destination does not have valid coordinates."
            );

            return;
        }


        // ---------------------------------------------
        // Vehicle validation
        // ---------------------------------------------

        if (
            !["bike", "auto", "car"].includes(
                vehicleType
            )
        ) {
            setError("Please select a valid vehicle type.");

            return;
        }


        try {
            setLoadingRoute(true);

            console.log("Pickup:", pickup);
            console.log("Destination:", destination);


            const response = await api.post(
                "/bookings/route-preview",
                {
                    pickupLatitude:
                        pickup.latitude,

                    pickupLongitude:
                        pickup.longitude,

                    dropLatitude:
                        destination.latitude,

                    dropLongitude:
                        destination.longitude,

                    vehicleType,
                }
            );


            const data = response.data;

            console.log(
                "Route response:",
                data
            );


            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to calculate route."
                );
            }


            setRoute(data.route);
            setFare(data.fare);


            setSuccess(
                "Route and fare calculated successfully."
            );

        } catch (err) {
            console.error(
                "Route calculation error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to calculate route."
            );

        } finally {
            setLoadingRoute(false);
        }
    };


    // =====================================================
    // CREATE BOOKING
    // =====================================================

    const createBooking = async () => {
        setError("");
        setSuccess("");


        // ---------------------------------------------
        // User validation
        // ---------------------------------------------

        if (!user?.id && !user?._id) {
    setError(
        "Please login again."
    );

    return;
}


        // ---------------------------------------------
        // Location validation
        // ---------------------------------------------

        if (!pickup) {
            setError(
                "Please select a pickup location from the Google suggestions."
            );

            return;
        }

        if (!destination) {
            setError(
                "Please select a destination from the Google suggestions."
            );

            return;
        }


        // ---------------------------------------------
        // Route validation
        // ---------------------------------------------

        if (!route) {
            setError(
                "Please calculate the route and fare first."
            );

            return;
        }


        try {
            setBookingLoading(true);


            /*
             * IMPORTANT:
             *
             * Fare is NOT sent from frontend.
             *
             * Backend calculates:
             *
             * Google route distance
             * +
             * vehicle type
             * =
             * final fare
             */

            const response = await api.post(
                "/bookings",
                {
                    user: user._id || user.id,

                    pickupLocation:
                        pickup.address,

                    pickupLatitude:
                        pickup.latitude,

                    pickupLongitude:
                        pickup.longitude,

                    dropLocation:
                        destination.address,

                    dropLatitude:
                        destination.latitude,

                    dropLongitude:
                        destination.longitude,

                    bookingDate,

                    vehicleType,
                }
            );


            const data = response.data;


            console.log(
                "Booking response:",
                data
            );


            setBooking(data.data);

            setFare(data.fare);
            setRoute(data.route);


            // -----------------------------------------
            // Women safety response
            // -----------------------------------------

            if (data.womenSafety?.enabled) {

                if (
                    data.womenSafety
                        ?.maleDriverConsent ===
                    "pending"
                ) {
                    setSuccess(
                        "No female driver is currently available. Please choose whether to allow a male driver."
                    );
                } else {
                    setSuccess(
                        data.message ||
                        "Ride booked successfully."
                    );
                }

            } else {
                setSuccess(
                    data.message ||
                    "Ride booked successfully."
                );
            }

        } catch (err) {
            console.error(
                "Booking error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create booking."
            );

        } finally {
            setBookingLoading(false);
        }
    };


    // =====================================================
    // DRIVER CONSENT
    // =====================================================

    const updateConsent = async (consent) => {
        if (!booking?._id) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const response = await api.patch(
                `/bookings/${booking._id}/women-driver-consent`,
                {
                    consent,
                }
            );

            setBooking(response.data.data);

            setSuccess(
                response.data.message
            );

        } catch (err) {
            console.error(
                "Consent error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update driver consent."
            );
        }
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <APIProvider
            apiKey={
                import.meta.env
                    .VITE_GOOGLE_MAPS_API_KEY
            }
            libraries={["places"]}
            region="IN"
            language="en"
        >

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "24px",
                }}
            >

                <h1
                    style={{
                        marginBottom: "20px",
                    }}
                >
                    Book a Ride
                </h1>


                {/* =========================================
                    ERROR
                ========================================= */}

                {error && (
                    <div
                        style={{
                            padding: "12px 15px",
                            marginBottom: "16px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: "10px",
                        }}
                    >
                        {error}
                    </div>
                )}


                {/* =========================================
                    SUCCESS
                ========================================= */}

                {success && (
                    <div
                        style={{
                            padding: "12px 15px",
                            marginBottom: "16px",
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: "10px",
                        }}
                    >
                        {success}
                    </div>
                )}


                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "1fr 1.5fr",
                        gap: "24px",
                    }}
                >

                    {/* =====================================
                        LEFT SIDE
                    ===================================== */}

                    <div
                        style={{
                            background: "#ffffff",
                            padding: "20px",
                            borderRadius: "16px",
                            boxShadow:
                                "0 4px 20px rgba(0,0,0,0.08)",
                        }}
                    >

                        {/* =================================
                            PICKUP
                        ================================= */}

                        <LocationSearch
                            label="Pickup Location"
                            placeholder="Search pickup location"
                            value={pickupText}
                            onChange={
                                handlePickupTextChange
                            }
                            onLocationSelected={
                                handlePickupSelected
                            }
                        />


                        {/* =================================
                            CURRENT LOCATION
                        ================================= */}

                        {currentLocation && (
                            <button
                                type="button"
                                onClick={
                                    useCurrentLocation
                                }
                                style={{
                                    width: "100%",
                                    marginBottom: "16px",
                                    padding: "10px 14px",
                                    border:
                                        "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "#f9fafb",
                                    cursor: "pointer",
                                }}
                            >
                                📍 Use Current Location
                            </button>
                        )}


                        {/* =================================
                            PICKUP STATUS
                        ================================= */}

                        {pickup && (
                            <div
                                style={{
                                    marginBottom: "16px",
                                    padding: "10px",
                                    background: "#f0fdf4",
                                    border:
                                        "1px solid #bbf7d0",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                }}
                            >
                                <strong>
                                    Pickup selected
                                </strong>

                                <div>
                                    {pickup.address}
                                </div>

                                <div
                                    style={{
                                        marginTop: "4px",
                                        color: "#166534",
                                    }}
                                >
                                    Coordinates:
                                    {" "}
                                    {pickup.latitude.toFixed(
                                        6
                                    )}
                                    ,
                                    {" "}
                                    {pickup.longitude.toFixed(
                                        6
                                    )}
                                </div>
                            </div>
                        )}


                        {/* =================================
                            DESTINATION
                        ================================= */}

                        <LocationSearch
                            label="Destination"
                            placeholder="Search destination"
                            value={
                                destinationText
                            }
                            onChange={
                                handleDestinationTextChange
                            }
                            onLocationSelected={
                                handleDestinationSelected
                            }
                        />


                        {/* =================================
                            DESTINATION STATUS
                        ================================= */}

                        {destination && (
                            <div
                                style={{
                                    marginBottom: "16px",
                                    padding: "10px",
                                    background: "#eff6ff",
                                    border:
                                        "1px solid #bfdbfe",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                }}
                            >
                                <strong>
                                    Destination selected
                                </strong>

                                <div>
                                    {
                                        destination.address
                                    }
                                </div>

                                <div
                                    style={{
                                        marginTop: "4px",
                                        color: "#1d4ed8",
                                    }}
                                >
                                    Coordinates:
                                    {" "}
                                    {destination.latitude.toFixed(
                                        6
                                    )}
                                    ,
                                    {" "}
                                    {destination.longitude.toFixed(
                                        6
                                    )}
                                </div>
                            </div>
                        )}


                        {/* =================================
                            VEHICLE
                        ================================= */}

                        <label
                            style={{
                                display: "block",
                                fontWeight: 600,
                                marginBottom: "7px",
                            }}
                        >
                            Vehicle Type
                        </label>

                        <select
                            value={vehicleType}
                            onChange={(event) => {
                                setVehicleType(
                                    event.target.value
                                );

                                setRoute(null);
                                setFare(null);
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius: "10px",
                                marginBottom: "16px",
                                boxSizing:
                                    "border-box",
                            }}
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


                        {/* =================================
                            DATE
                        ================================= */}

                        <label
                            style={{
                                display: "block",
                                fontWeight: 600,
                                marginBottom: "7px",
                            }}
                        >
                            Booking Date & Time
                        </label>

                        <input
                            type="datetime-local"
                            value={bookingDate}
                            onChange={(event) =>
                                setBookingDate(
                                    event.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius: "10px",
                                marginBottom: "16px",
                                boxSizing:
                                    "border-box",
                            }}
                        />


                        {/* =================================
                            WOMEN SAFETY
                        ================================= */}

                        {isFemale && (
                            <div
                                style={{
                                    padding: "15px",
                                    marginBottom: "16px",
                                    background: "#fdf2f8",
                                    border:
                                        "1px solid #f9a8d4",
                                    borderRadius: "12px",
                                }}
                            >
                                <strong>
                                    Women Safety: ACTIVE
                                </strong>

                                <p
                                    style={{
                                        margin:
                                            "7px 0 0",
                                    }}
                                >
                                    Female drivers will
                                    be preferred for
                                    your ride.
                                </p>
                            </div>
                        )}


                        {/* =================================
                            CALCULATE
                        ================================= */}

                        <button
                            type="button"
                            onClick={
                                calculateRouteAndFare
                            }
                            disabled={
                                loadingRoute
                            }
                            style={{
                                width: "100%",
                                padding: "13px",
                                border: "none",
                                borderRadius: "10px",
                                background:
                                    "#111827",
                                color: "#ffffff",
                                cursor:
                                    loadingRoute
                                        ? "not-allowed"
                                        : "pointer",
                                opacity:
                                    loadingRoute
                                        ? 0.7
                                        : 1,
                            }}
                        >
                            {loadingRoute
                                ? "Calculating..."
                                : "Calculate Route & Fare"}
                        </button>


                        {/* =================================
                            ROUTE RESULT
                        ================================= */}

                        {route && (
                            <div
                                style={{
                                    marginTop: "16px",
                                    padding: "15px",
                                    background: "#f9fafb",
                                    borderRadius: "12px",
                                }}
                            >

                                <div>
                                    <strong>
                                        Distance:
                                    </strong>{" "}
                                    {
                                        route.distanceKm
                                    }{" "}
                                    km
                                </div>

                                <div
                                    style={{
                                        marginTop: "5px",
                                    }}
                                >
                                    <strong>
                                        ETA:
                                    </strong>{" "}
                                    {
                                        route.durationMinutes
                                    }{" "}
                                    minutes
                                </div>

                                <div
                                    style={{
                                        marginTop: "12px",
                                        fontSize: "22px",
                                        fontWeight: 700,
                                    }}
                                >
                                    Estimated Fare:
                                    {" "}
                                    ₹{fare}
                                </div>


                                {/* =========================
                                    CONFIRM BOOKING
                                ========================= */}

                                <button
                                    type="button"
                                    onClick={
                                        createBooking
                                    }
                                    disabled={
                                        bookingLoading
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "13px",
                                        border: "none",
                                        borderRadius:
                                            "10px",
                                        background:
                                            "#16a34a",
                                        color:
                                            "#ffffff",
                                        cursor:
                                            bookingLoading
                                                ? "not-allowed"
                                                : "pointer",
                                        marginTop:
                                            "16px",
                                        opacity:
                                            bookingLoading
                                                ? 0.7
                                                : 1,
                                    }}
                                >
                                    {bookingLoading
                                        ? "Creating..."
                                        : "Confirm Ride"}
                                </button>

                            </div>
                        )}


                        {/* =================================
                            MALE DRIVER CONSENT
                        ================================= */}

                        {isFemale &&
                            booking?.maleDriverConsent ===
                                "pending" && (

                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "16px",
                                    background:
                                        "#fff7ed",
                                    border:
                                        "1px solid #fdba74",
                                    borderRadius: "12px",
                                }}
                            >

                                <strong>
                                    No female driver is
                                    currently available.
                                </strong>

                                <p>
                                    Would you like to
                                    allow a male driver
                                    for this ride?
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateConsent(
                                                "accepted"
                                            )
                                        }
                                        style={{
                                            padding:
                                                "10px 15px",
                                            border: "none",
                                            borderRadius:
                                                "8px",
                                            cursor:
                                                "pointer",
                                            background:
                                                "#16a34a",
                                            color:
                                                "#ffffff",
                                        }}
                                    >
                                        Allow Male Driver
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateConsent(
                                                "declined"
                                            )
                                        }
                                        style={{
                                            padding:
                                                "10px 15px",
                                            border:
                                                "1px solid #d1d5db",
                                            borderRadius:
                                                "8px",
                                            cursor:
                                                "pointer",
                                            background:
                                                "#ffffff",
                                        }}
                                    >
                                        Continue Waiting
                                    </button>

                                </div>

                            </div>
                        )}

                    </div>


                    {/* =====================================
                        MAP
                    ===================================== */}

                    <div>

                        <GoogleMap
                            pickup={
                                pickup
                                    ? {
                                          lat:
                                              pickup.latitude,
                                          lng:
                                              pickup.longitude,
                                      }
                                    : null
                            }

                            destination={
                                destination
                                    ? {
                                          lat:
                                              destination.latitude,
                                          lng:
                                              destination.longitude,
                                      }
                                    : null
                            }

                            routePolyline={
                                route?.encodedPolyline ||
                                null
                            }
                        />

                    </div>

                </div>

            </div>

        </APIProvider>
    );
}

export default BookRide;