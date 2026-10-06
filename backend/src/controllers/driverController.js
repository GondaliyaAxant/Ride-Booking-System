const Driver = require("../models/Driver");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

// Create Driver Profile
const createDriver = async (req, res) => {
    try {
        let userId = req.body.user;
        if (!userId && req.user) {
            userId = req.user._id;
        }

        const existingDriver = await Driver.findOne({ user: userId });
        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: "Driver profile already exists for this user",
                data: existingDriver,
            });
        }

        const driver = new Driver({
            ...req.body,
            user: userId,
        });

        const savedDriver = await driver.save();

        return res.status(201).json({
            success: true,
            message: "Driver profile created successfully",
            data: savedDriver,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to create driver profile",
            error: error.message,
        });
    }
};

// Get All Drivers
const getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find()
            .populate("user", "name email phone gender isActive")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Drivers fetched successfully",
            data: drivers,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch drivers",
            error: error.message,
        });
    }
};

// Get My Driver Profile
const getMyDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id }).populate(
            "user",
            "name email phone gender isActive"
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found for current user",
            });
        }

        const vehicle = await Vehicle.findOne({
            driver: driver._id,
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            data: {
                ...driver.toObject(),
                vehicle,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch driver profile",
            error: error.message,
        });
    }
};

// Get Driver By ID
const getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).populate(
            "user",
            "name email phone gender isActive"
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        const vehicle = await Vehicle.findOne({
            driver: driver._id,
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            message: "Driver fetched successfully",
            data: {
                ...driver.toObject(),
                vehicle,
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid driver ID",
            error: error.message,
        });
    }
};

// Update Driver
const updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate("user", "name email phone gender isActive");

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver updated successfully",
            data: driver,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to update driver",
            error: error.message,
        });
    }
};

// Toggle Online Status
const toggleOnlineStatus = async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user._id });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        driver.isOnline =
            req.body.isOnline !== undefined ? req.body.isOnline : !driver.isOnline;
        await driver.save();

        return res.status(200).json({
            success: true,
            message: `Driver is now ${driver.isOnline ? "Online" : "Offline"}`,
            data: driver,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to toggle online status",
            error: error.message,
        });
    }
};

// Admin Approve Driver
const approveDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            {
                isApproved: true,
                verificationStatus: "approved",
            },
            { new: true }
        ).populate("user", "name email phone gender");

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver approved successfully",
            data: driver,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to approve driver",
            error: error.message,
        });
    }
};

// Admin Reject Driver
const rejectDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            {
                isApproved: false,
                verificationStatus: "rejected",
            },
            { new: true }
        ).populate("user", "name email phone gender");

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver rejected successfully",
            data: driver,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to reject driver",
            error: error.message,
        });
    }
};

// Delete Driver
const deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver deleted successfully",
            data: driver,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete driver",
            error: error.message,
        });
    }
};

module.exports = {
    createDriver,
    getDrivers,
    getMyDriverProfile,
    getDriverById,
    updateDriver,
    toggleOnlineStatus,
    approveDriver,
    rejectDriver,
    deleteDriver,
};