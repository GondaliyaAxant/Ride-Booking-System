const Ride = require("../models/ride");

// Create Ride
const createRide = async (req, res) => {
    try {
        const ride = new Ride(req.body);
        const savedRide = await ride.save();

        res.status(201).json({
            success: true,
            message: "Ride created successfully",
            data: savedRide
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create ride",
            error: error.message
        });
    }
};

// Get All Rides
const getRides = async (req, res) => {
    try {
        const rides = await Ride.find();

        res.status(200).json({
            success: true,
            message: "Rides fetched successfully",
            data: rides
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch rides",
            error: error.message
        });
    }
};

// Get Ride By ID
const getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Ride not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Ride fetched successfully",
            data: ride
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid ride ID",
            error: error.message
        });
    }
};

// Update Ride
const updateRide = async (req, res) => {
    try {
        const ride = await Ride.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Ride not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Ride updated successfully",
            data: ride
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update ride",
            error: error.message
        });
    }
};

// Delete Ride
const deleteRide = async (req, res) => {
    try {
        const ride = await Ride.findByIdAndDelete(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: "Ride not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Ride deleted successfully",
            data: ride
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete ride",
            error: error.message
        });
    }
};

module.exports = {
    createRide,
    getRides,
    getRideById,
    updateRide,
    deleteRide
};