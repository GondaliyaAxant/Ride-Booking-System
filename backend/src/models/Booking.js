const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null,
            index: true,
        },

        pickupLocation: {
            type: String,
            required: true,
            trim: true,
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
            trim: true,
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
            index: true,
        },

        scheduledAt: {
            type: Date,
            default: function () {
                return this.bookingDate;
            },
        },

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
                "driver_arriving",
                "driver_arrived",
                "ongoing",
                "completed",
                "cancelled",
            ],
            default: "pending",
            index: true,
        },

        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi"],
            default: "cash",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
        },

        // Women safety fields
        womenSafety: {
            type: Boolean,
            default: false,
            index: true,
        },

        femaleDriverPreferred: {
            type: Boolean,
            default: false,
        },

        maleDriverConsent: {
            type: String,
            enum: ["not_required", "pending", "accepted", "declined"],
            default: "not_required",
            index: true,
        },

        consentAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            default: null,
            trim: true,
        },

        // Track which drivers have rejected this booking so they don't see it again
        rejectedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Driver",
            },
        ],

        // Timestamp when a driver accepted the booking
        acceptedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ user: 1, bookingDate: -1 });
bookingSchema.index({ driver: 1, bookingDate: -1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ rejectedBy: 1, status: 1 });

module.exports =
    mongoose.models.Booking || mongoose.model("Booking", bookingSchema);