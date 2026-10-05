const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null,
        },

        pickupLocation: {
            type: String,
            required: true,
        },

        pickupLatitude: {
            type: Number,
            required: true,
        },

        pickupLongitude: {
            type: Number,
            required: true,
        },

        dropLocation: {
            type: String,
            required: true,
        },

        dropLatitude: {
            type: Number,
            required: true,
        },

        dropLongitude: {
            type: Number,
            required: true,
        },

        bookingDate: {
            type: Date,
            required: true,
        },

        /*
         * IMPORTANT:
         * Rider no longer sends the final fare.
         * Backend calculates it from Google route distance.
         */
        fare: {
            type: Number,
            required: true,
            min: 0,
        },

        distanceKm: {
            type: Number,
            required: true,
            min: 0,
        },

        durationMinutes: {
            type: Number,
            required: true,
            min: 0,
        },

        routePolyline: {
            type: String,
            default: "",
        },

        vehicleType: {
            type: String,
            enum: ["bike", "auto", "car"],
            required: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "ongoing",
                "completed",
                "cancelled",
            ],
            default: "pending",
        },

        /*
         * Women safety is automatically enabled
         * ONLY for female riders.
         */
        womenSafety: {
            type: Boolean,
            default: false,
        },

        maleDriverConsent: {
            type: String,
            enum: [
                "not_required",
                "pending",
                "accepted",
                "declined",
            ],
            default: "not_required",
        },

        consentAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Booking",
    bookingSchema
);