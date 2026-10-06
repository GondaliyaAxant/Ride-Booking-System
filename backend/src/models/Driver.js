const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
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
            index: true,
        },
        rating: {
            type: Number,
            default: 5.0,
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
            index: true,
        },
        isOnline: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

driverSchema.index({ user: 1, isApproved: 1, verificationStatus: 1 });

module.exports = mongoose.models.Driver || mongoose.model("Driver", driverSchema);