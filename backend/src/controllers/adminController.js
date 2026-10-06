const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Payment = require("../models/Payment");
const Report = require("../models/Report");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin1@gmail.com";
const bcrypt = require("bcryptjs");

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check MongoDB User collection
        const dbAdmin = await User.findOne({
            email: normalizedEmail,
            role: "admin",
        });

        if (dbAdmin) {
            const isMatch = await bcrypt.compare(password, dbAdmin.password);
            if (isMatch) {
                const token = jwt.sign(
                    {
                        id: dbAdmin._id,
                        _id: dbAdmin._id,
                        role: "admin",
                        email: dbAdmin.email,
                    },
                    process.env.JWT_SECRET || "ride_booking_system_secret_2026",
                    {
                        expiresIn: "7d",
                    }
                );

                return res.status(200).json({
                    success: true,
                    message: "Admin login successful",
                    token,
                    user: {
                        id: dbAdmin._id,
                        _id: dbAdmin._id,
                        email: dbAdmin.email,
                        name: dbAdmin.name || "Administrator",
                        role: "admin",
                    },
                });
            }
        }

        // 2. Fallback check for config credentials
        if (
            normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
            password === ADMIN_PASSWORD
        ) {
            const token = jwt.sign(
                {
                    id: "admin",
                    role: "admin",
                    email: ADMIN_EMAIL,
                },
                process.env.JWT_SECRET || "ride_booking_system_secret_2026",
                {
                    expiresIn: "7d",
                }
            );

            return res.status(200).json({
                success: true,
                message: "Admin login successful",
                token,
                user: {
                    id: "admin",
                    email: ADMIN_EMAIL,
                    name: "Administrator",
                    role: "admin",
                },
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid admin email or password",
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "Admin login failed",
            error: error.message,
        });
    }
};

const getAdminProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
};

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDrivers,
            approvedDrivers,
            pendingDrivers,
            totalVehicles,
            totalBookings,
            completedBookings,
            cancelledBookings,
            allCompletedBookings,
            womenSafetyBookings,
        ] = await Promise.all([
            User.countDocuments(),
            Driver.countDocuments(),
            Driver.countDocuments({ isApproved: true, verificationStatus: "approved" }),
            Driver.countDocuments({ verificationStatus: "pending" }),
            Vehicle.countDocuments(),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "completed" }),
            Booking.countDocuments({ status: "cancelled" }),
            Booking.find({ status: "completed" }).select("fare"),
            Booking.find({ womenSafety: true })
                .populate("user", "name email phone gender")
                .populate({
                    path: "driver",
                    populate: { path: "user", select: "name email phone gender" },
                }),
        ]);

        const totalRevenue = allCompletedBookings.reduce(
            (sum, b) => sum + (Number(b.fare) || 0),
            0
        );

        const femaleDriversAssigned = womenSafetyBookings.filter(
            (b) => b.driver && b.driver.user && b.driver.user.gender === "female"
        ).length;

        const maleDriverConsentPending = womenSafetyBookings.filter(
            (b) => b.maleDriverConsent === "pending"
        ).length;

        const maleDriverConsentAccepted = womenSafetyBookings.filter(
            (b) => b.maleDriverConsent === "accepted"
        ).length;

        const maleDriverConsentDeclined = womenSafetyBookings.filter(
            (b) => b.maleDriverConsent === "declined"
        ).length;

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalDrivers,
                approvedDrivers,
                pendingDrivers,
                totalVehicles,
                totalBookings,
                completedBookings,
                cancelledBookings,
                totalRevenue,
                womenSafety: {
                    total: womenSafetyBookings.length,
                    femaleDriversAssigned,
                    maleDriverConsentPending,
                    maleDriverConsentAccepted,
                    maleDriverConsentDeclined,
                },
            },
        });
    } catch (error) {
        console.error("Admin dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load admin stats",
            error: error.message,
        });
    }
};

module.exports = {
    adminLogin,
    getAdminProfile,
    getDashboardStats,
};