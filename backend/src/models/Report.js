const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        ride: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ride",
            default: null,
        },

        reportType: {
            type: String,
            enum: [
                "ride",
                "driver",
                "payment",
                "other",
            ],
            required: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Report", reportSchema);