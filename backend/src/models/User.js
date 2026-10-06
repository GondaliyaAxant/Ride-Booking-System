const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["rider", "driver", "admin"],
            default: "rider",
            index: true,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            required: true,
            index: true,
        },
        profileImage: {
            type: String,
            default: null,
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

module.exports = mongoose.models.User || mongoose.model("User", userSchema);