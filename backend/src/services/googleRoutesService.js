const GOOGLE_ROUTES_URL =
    "https://routes.googleapis.com/directions/v2:computeRoutes";

/**
 * Calculate route using Google Routes API.
 *
 * Returns:
 * - distanceMeters
 * - distanceKm
 * - durationSeconds
 * - durationMinutes
 * - encodedPolyline
 */
const calculateRoute = async (pickup, destination) => {
    if (!pickup || !destination) {
        throw new Error("Pickup and destination are required");
    }

    const pickupLatitude = Number(pickup.latitude);
    const pickupLongitude = Number(pickup.longitude);

    const destinationLatitude = Number(destination.latitude);
    const destinationLongitude = Number(destination.longitude);

    if (
        !Number.isFinite(pickupLatitude) ||
        !Number.isFinite(pickupLongitude) ||
        !Number.isFinite(destinationLatitude) ||
        !Number.isFinite(destinationLongitude)
    ) {
        throw new Error("Invalid pickup or destination coordinates");
    }

    if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) {
        throw new Error(
            "GOOGLE_MAPS_SERVER_API_KEY is not configured"
        );
    }

    const requestBody = {
        origin: {
            location: {
                latLng: {
                    latitude: pickupLatitude,
                    longitude: pickupLongitude,
                },
            },
        },

        destination: {
            location: {
                latLng: {
                    latitude: destinationLatitude,
                    longitude: destinationLongitude,
                },
            },
        },

        travelMode: "DRIVE",

        routingPreference: "TRAFFIC_AWARE",

        computeAlternativeRoutes: false,

        routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false,
        },

        languageCode: "en-US",

        units: "METRIC",
    };

    const response = await fetch(GOOGLE_ROUTES_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",

            "X-Goog-Api-Key":
                process.env.GOOGLE_MAPS_SERVER_API_KEY,

            "X-Goog-FieldMask":
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },

        body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Google Routes API error:", data);

        throw new Error(
            data?.error?.message ||
                "Google Routes API request failed"
        );
    }

    if (!data.routes || data.routes.length === 0) {
        throw new Error(
            "No route found between pickup and destination"
        );
    }

    const route = data.routes[0];

    const distanceMeters = Number(route.distanceMeters || 0);

    const distanceKm = Number(
        (distanceMeters / 1000).toFixed(2)
    );

    /*
     * Google duration normally comes as:
     * "1234s"
     */
    const durationSeconds = parseInt(
        String(route.duration || "0s").replace("s", ""),
        10
    );

    const durationMinutes = Math.ceil(
        durationSeconds / 60
    );

    const encodedPolyline =
        route?.polyline?.encodedPolyline || "";

    return {
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        encodedPolyline,
    };
};

module.exports = {
    calculateRoute,
};