const mongoose = require("mongoose");

const driverAvailabilitySchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        startTime: {
            type: String,
            required: true,
            trim: true,
        },
        endTime: {
            type: String,
            required: true,
            trim: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

driverAvailabilitySchema.index({ driver: 1, date: 1, isAvailable: 1 });

module.exports =
    mongoose.models.DriverAvailability ||
    mongoose.model("DriverAvailability", driverAvailabilitySchema);