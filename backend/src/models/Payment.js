const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            sparse: true,
            index: true,
        },

        ride: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ride",
            sparse: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);