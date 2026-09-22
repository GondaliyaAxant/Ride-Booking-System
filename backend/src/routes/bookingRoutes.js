const express = require("express");

const router = express.Router();

const {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    updateWomenDriverConsent,
} = require("../controllers/bookingController");


/*
    Create booking
    POST /api/bookings
*/
router.post("/", createBooking);


/*
    Get all bookings
    GET /api/bookings
*/
router.get("/", getBookings);


/*
    Get booking by ID
    GET /api/bookings/:id
*/
router.get("/:id", getBookingById);


/*
    Women safety consent

    PUT /api/bookings/:id/women-driver-consent
*/
router.put(
    "/:id/women-driver-consent",
    updateWomenDriverConsent
);


/*
    Update booking
    PUT /api/bookings/:id
*/
router.put("/:id", updateBooking);


/*
    Delete booking
    DELETE /api/bookings/:id
*/
router.delete("/:id", deleteBooking);


module.exports = router;