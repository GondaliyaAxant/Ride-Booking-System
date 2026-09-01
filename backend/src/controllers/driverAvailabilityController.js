const DriverAvailability = require("../models/driveravailability");

// Create Availability
const createAvailability = async (req, res) => {
    try {
        const availability = new DriverAvailability(req.body);
        const savedAvailability = await availability.save();

        res.status(201).json({
            success: true,
            message: "Driver availability created successfully",
            data: savedAvailability
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create driver availability",
            error: error.message
        });
    }
};

// Get All Availability
const getAvailabilities = async (req, res) => {
    try {
        const availabilities = await DriverAvailability.find();

        res.status(200).json({
            success: true,
            message: "Driver availabilities fetched successfully",
            data: availabilities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch driver availabilities",
            error: error.message
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
                message: "Driver availability not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver availability fetched successfully",
            data: availability
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid availability ID",
            error: error.message
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
                runValidators: true
            }
        );

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Driver availability not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver availability updated successfully",
            data: availability
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update driver availability",
            error: error.message
        });
    }
};

// Delete Availability
const deleteAvailability = async (req, res) => {
    try {
        const availability =
            await DriverAvailability.findByIdAndDelete(req.params.id);

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Driver availability not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver availability deleted successfully",
            data: availability
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete driver availability",
            error: error.message
        });
    }
};

module.exports = {
    createAvailability,
    getAvailabilities,
    getAvailabilityById,
    updateAvailability,
    deleteAvailability
};