const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
    createBooking,
    routePreview,
    updateWomenDriverConsent,
    getBookings,
    getBookingById,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    getDriverPendingBookings,
    acceptBookingByDriver,
    rejectBookingByDriver,
} = require("../controllers/bookingController");

// Route & Fare calculation preview (Public or Authenticated)
router.post("/route-preview", routePreview);

// Create Booking (Authenticated rider)
router.post("/", protect, createBooking);

// Get Bookings (Filtered by user/driver role, or all for admin)
router.get("/", protect, getBookings);

// Get Driver Pending Bookings
router.get(
    "/driver/pending",
    protect,
    authorize("driver", "admin"),
    getDriverPendingBookings
);
router.get(
    "/driver/:userId/pending",
    protect,
    getDriverPendingBookings
);

// Driver accepts a booking
router.patch(
    "/driver/accept/:bookingId",
    protect,
    authorize("driver", "admin"),
    acceptBookingByDriver
);
router.patch(
    "/driver/:userId/:bookingId/accept",
    protect,
    acceptBookingByDriver
);

// Driver rejects/passes on a booking
router.patch(
    "/driver/reject/:bookingId",
    protect,
    authorize("driver", "admin"),
    rejectBookingByDriver
);

// Get booking by ID
router.get("/:id", protect, getBookingById);

// Update booking status (Lifecycle: driver_arriving, ongoing, completed, cancelled)
router.patch("/:id/status", protect, updateBookingStatus);
router.patch("/:id/cancel", protect, (req, res, next) => {
    req.body.status = "cancelled";
    updateBookingStatus(req, res, next);
});

// Female rider male-driver consent response
router.patch("/:id/women-driver-consent", protect, updateWomenDriverConsent);

// Update/Delete booking
router.put("/:id", protect, updateBooking);
router.delete("/:id", protect, deleteBooking);

module.exports = router;