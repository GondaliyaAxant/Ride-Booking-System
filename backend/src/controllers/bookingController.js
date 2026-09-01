const Booking = require("../models/booking");

// Create Booking
const createBooking = async (req, res) => {
    try {
        const booking = new Booking(req.body);
        const savedBooking = await booking.save();

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: savedBooking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create booking",
            error: error.message
        });
    }
};

// Get All Bookings
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();

        res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
};

// Get Booking By ID
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid booking ID",
            error: error.message
        });
    }
};

// Update Booking
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update booking",
            error: error.message
        });
    }
};

// Delete Booking
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking
};