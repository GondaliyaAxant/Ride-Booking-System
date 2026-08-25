const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
    {
        rider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null,
        },

        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },

        pickupLocation: {
            address: {
                type: String,
                required: true,
                trim: true,
            },
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },

        dropLocation: {
            address: {
                type: String,
                required: true,
                trim: true,
            },
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },

        fare: {
            type: Number,
            default: 0,
            min: 0,
        },

        distance: {
            type: Number,
            default: 0,
            min: 0,
        },

        rideStatus: {
            type: String,
            enum: [
                "requested",
                "accepted",
                "driverArriving",
                "started",
                "completed",
                "cancelled",
            ],
            default: "requested",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
        },

        isPreBooked: {
            type: Boolean,
            default: false,
        },

        scheduledAt: {
            type: Date,
            default: null,
        },

        womenSafetyPreference: {
            type: String,
            enum: ["any", "femaleOnly", "femalePreferred"],
            default: "any",
        },

        maleDriverAccepted: {
            type: Boolean,
            default: false,
        },

        cancellationReason: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Ride", rideSchema);