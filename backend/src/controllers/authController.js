const User = require("../models/User");
const Driver = require("../models/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            role,
            gender,
            profileImage,
        } = req.body;

        // Check required fields
        if (!name || !email || !phone || !password || !gender) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, phone, password, and gender",
            });
        }

        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(gender.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Gender must be 'male', 'female', or 'other'",
            });
        }

        const userRole = role === "driver" ? "driver" : "rider";

        // Check if email already exists
        const existingEmail = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered",
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({
            phone: phone.trim(),
        });

        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is already registered",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: userRole,
            gender: gender.toLowerCase(),
            profileImage: profileImage || null,
            isActive: true,
        });

        // If driver role, create corresponding Driver profile placeholder if not exists
        let driverProfile = null;
        if (userRole === "driver") {
            driverProfile = await Driver.create({
                user: user._id,
                licenseNumber: `DL-${Date.now().toString().slice(-6)}`,
                licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5),
                verificationStatus: "approved", // Auto-approve for demo/testing or keep approved
                isApproved: true,
                rating: 5.0,
                totalRides: 0,
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                gender: user.gender,
            },
            process.env.JWT_SECRET || "ride_booking_system_secret_2026",
            {
                expiresIn: "7d",
            }
        );

        const userResponse = {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            gender: user.gender,
            profileImage: user.profileImage,
            isActive: user.isActive,
            driverId: driverProfile ? driverProfile._id : undefined,
        };

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: userResponse,
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive. Please contact support.",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                gender: user.gender,
            },
            process.env.JWT_SECRET || "ride_booking_system_secret_2026",
            {
                expiresIn: "7d",
            }
        );

        let driverId = undefined;
        if (user.role === "driver") {
            const driver = await Driver.findOne({ user: user._id });
            if (driver) {
                driverId = driver._id;
            }
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                profileImage: user.profileImage,
                isActive: user.isActive,
                driverId,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let driver = null;
        if (user.role === "driver") {
            driver = await Driver.findOne({ user: user._id });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                profileImage: user.profileImage,
                isActive: user.isActive,
                driver: driver || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get user profile",
            error: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};