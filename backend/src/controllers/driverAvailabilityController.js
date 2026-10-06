const DriverAvailability = require("../models/DriverAvailability");
const Driver = require("../models/Driver");
const {
    assignPendingBookingsForDriver,
} = require("./bookingController");

// Create Availability
const createAvailability = async (req, res) => {
    try {
        let driverId = req.body.driver;

        // If not explicitly provided, find driver from authenticated user
        if (!driverId && req.user) {
            const driverDoc = await Driver.findOne({ user: req.user._id });
            if (driverDoc) {
                driverId = driverDoc._id;
            }
        }

        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Driver profile is required",
            });
        }

        const { date, startTime, endTime, isAvailable } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Date, startTime, and endTime are required",
            });
        }

        const availability = new DriverAvailability({
            driver: driverId,
            date: new Date(date),
            startTime,
            endTime,
            isAvailable: isAvailable !== false,
        });

        const savedAvailability = await availability.save();

        // If driver switched availability ON, immediately check for matching pending bookings
        if (savedAvailability.isAvailable) {
            await assignPendingBookingsForDriver(savedAvailability.driver);
        }

        return res.status(201).json({
            success: true,
            message: "Driver availability created successfully",
            data: savedAvailability,
        });
    } catch (error) {
        console.error("Create availability error:", error);
        return res.status(400).json({
            success: false,
            message: "Failed to create driver availability",
            error: error.message,
        });
    }
};

// Get All Availability
const getAvailabilities = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === "driver") {
            const driver = await Driver.findOne({ user: req.user._id });
            if (driver) {
                query.driver = driver._id;
            }
        }

        const availabilities = await DriverAvailability.find(query)
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            })
            .sort({ date: 1, startTime: 1 });

        return res.status(200).json({
            success: true,
            message: "Driver availabilities fetched successfully",
            data: availabilities,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch driver availabilities",
            error: error.message,
        });
    }
};

// Get Availability By ID
const getAvailabilityById = async (req, res) => {
    try {
        const availability = await DriverAvailability.findById(req.params.id);

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Driver availability not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver availability fetched successfully",
            data: availability,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid availability ID",
            error: error.message,
        });
    }
};

// Get Availability By Driver
const getAvailabilityByDriver = async (req, res) => {
    try {
        let driverId = req.params.driverId;

        // If "my", look up driver for current user
        if (driverId === "my" && req.user) {
            const driver = await Driver.findOne({ user: req.user._id });
            if (driver) {
                driverId = driver._id;
            }
        }

        const availabilities = await DriverAvailability.find({
            driver: driverId,
        }).sort({ date: 1, startTime: 1 });

        return res.status(200).json({
            success: true,
            message: "Driver availabilities fetched successfully",
            data: availabilities,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to fetch driver availability",
            error: error.message,
        });
    }
};

// Update Availability
const updateAvailability = async (req, res) => {
    try {
        const availability = await DriverAvailability.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Driver availability not found",
            });
        }

        // If driver switched availability ON, immediately check for pending bookings
        if (availability.isAvailable) {
            await assignPendingBookingsForDriver(availability.driver);
        }

        return res.status(200).json({
            success: true,
            message: "Driver availability updated successfully",
            data: availability,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to update driver availability",
            error: error.message,
        });
    }
};

// Delete Availability
const deleteAvailability = async (req, res) => {
    try {
        const availability = await DriverAvailability.findByIdAndDelete(
            req.params.id
        );

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Driver availability not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver availability deleted successfully",
            data: availability,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete driver availability",
            error: error.message,
        });
    }
};

module.exports = {
    createAvailability,
    getAvailabilities,
    getAvailabilityById,
    getAvailabilityByDriver,
    updateAvailability,
    deleteAvailability,
};