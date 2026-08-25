const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        licenseNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        licenseExpiry: {
            type: Date,
            required: true,
        },

        verificationStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        totalRides: {
            type: Number,
            default: 0,
            min: 0,
        },

        isApproved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Driver", driverSchema);