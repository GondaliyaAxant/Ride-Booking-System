const Vehicle = require("../models/vehicle");

// Create Vehicle
const createVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        const savedVehicle = await vehicle.save();

        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: savedVehicle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create vehicle",
            error: error.message
        });
    }
};

// Get All Vehicles
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();

        res.status(200).json({
            success: true,
            message: "Vehicles fetched successfully",
            data: vehicles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch vehicles",
            error: error.message
        });
    }
};

// Get Vehicle By ID
const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle fetched successfully",
            data: vehicle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid vehicle ID",
            error: error.message
        });
    }
};

// Update Vehicle
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: vehicle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update vehicle",
            error: error.message
        });
    }
};

// Delete Vehicle
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully",
            data: vehicle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete vehicle",
            error: error.message
        });
    }
};

module.exports = {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};