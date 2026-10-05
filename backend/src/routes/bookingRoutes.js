const express = require("express");

const router = express.Router();

const {
    createBooking,
    routePreview,
    updateWomenDriverConsent,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getDriverPendingBookings,
    acceptBookingByDriver,
} = require("../controllers/bookingController");


router.post(
    "/",
    createBooking
);

router.post(
    "/route-preview",
    routePreview
);

router.get(
    "/",
    getBookings
);

router.get(
    "/driver/:userId/pending",
    getDriverPendingBookings
);

router.patch(
    "/driver/:userId/:bookingId/accept",
    acceptBookingByDriver
);
router.get(
    "/:id",
    getBookingById
);


router.put(
    "/:id",
    updateBooking
);


router.delete(
    "/:id",
    deleteBooking
);


/*
 * Female rider only.
 *
 * Used when:
 * - women safety is active
 * - no female driver is available
 * - rider decides whether a male driver is acceptable
 */
router.patch(
    "/:id/women-driver-consent",
    updateWomenDriverConsent
);


module.exports = router;