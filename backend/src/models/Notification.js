const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "ride",
                "women_safety",
                "payment",
                "rating",
                "report",
                "system",
            ],
            default: "ride",
        },

        relatedBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },

        relatedRide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ride",
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);