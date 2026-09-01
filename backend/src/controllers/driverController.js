const Driver = require("../models/driver");

// Create Driver
const createDriver = async (req, res) => {
    try {
        const driver = new Driver(req.body);
        const savedDriver = await driver.save();

        res.status(201).json({
            success: true,
            message: "Driver created successfully",
            data: savedDriver
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create driver",
            error: error.message
        });
    }
};

// Get All Drivers
const getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find();

        res.status(200).json({
            success: true,
            message: "Drivers fetched successfully",
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch drivers",
            error: error.message
        });
    }
};

// Get Driver By ID
const getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver fetched successfully",
            data: driver
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid driver ID",
            error: error.message
        });
    }
};

// Update Driver
const updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver updated successfully",
            data: driver
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update driver",
            error: error.message
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
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver deleted successfully",
            data: driver
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete driver",
            error: error.message
        });
    }
};

module.exports = {
    createDriver,
    getDrivers,
    getDriverById,
    updateDriver,
    deleteDriver
};