const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            index: true,
        },

        vehicleType: {
            type: String,
            enum: ["bike", "auto", "car"],
            required: true,
            index: true,
        },

        brand: {
            type: String,
            required: true,
            trim: true,
        },

        model: {
            type: String,
            required: true,
            trim: true,
        },

        color: {
            type: String,
            required: true,
            trim: true,
        },

        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            index: true,
        },

        capacity: {
            type: Number,
            required: true,
            min: 1,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);