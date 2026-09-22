const Booking = require("../models/booking");
const User = require("../models/user");
const Driver = require("../models/driver");
const DriverAvailability = require("../models/driverAvailability");
const Notification = require("../models/notification");

// ---------------------------------------------------------
// Helper: Convert HH:mm to minutes
// ---------------------------------------------------------
const timeToMinutes = (time) => {
    if (!time) return null;

    const [hours, minutes] = time.split(":").map(Number);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;
};


// ---------------------------------------------------------
// Helper: Check whether driver is available
// ---------------------------------------------------------
const isDriverAvailable = async (driverId, bookingDate) => {
    const booking = new Date(bookingDate);

    if (Number.isNaN(booking.getTime())) {
        return false;
    }

    // Date portion in UTC
    const bookingDateString = booking.toISOString().split("T")[0];

    const startOfDay = new Date(`${bookingDateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${bookingDateString}T23:59:59.999Z`);

    const availabilities = await DriverAvailability.find({
        driver: driverId,
        isAvailable: true,
        date: {
            $gte: startOfDay,
            $lte: endOfDay,
        },
    });

    if (availabilities.length === 0) {
        return false;
    }

    const bookingMinutes =
        booking.getUTCHours() * 60 + booking.getUTCMinutes();

    for (const availability of availabilities) {
        const startMinutes = timeToMinutes(availability.startTime);
        const endMinutes = timeToMinutes(availability.endTime);

        if (
            startMinutes === null ||
            endMinutes === null
        ) {
            continue;
        }

        if (
            bookingMinutes >= startMinutes &&
            bookingMinutes <= endMinutes
        ) {
            return true;
        }
    }

    return false;
};


// ---------------------------------------------------------
// Helper: Find available driver by gender
// ---------------------------------------------------------
const findAvailableDriver = async (gender, bookingDate) => {
    const drivers = await Driver.find({
        isApproved: true,
        verificationStatus: "approved",
    }).populate("user");

    // Keep only drivers whose linked user has requested gender
    const genderMatchedDrivers = drivers.filter(
        (driver) =>
            driver.user &&
            driver.user.gender === gender &&
            driver.user.isActive !== false
    );

    // Check availability
    for (const driver of genderMatchedDrivers) {
        const available = await isDriverAvailable(
            driver._id,
            bookingDate
        );

        if (available) {
            return driver;
        }
    }

    return null;
};


// =========================================================
// CREATE BOOKING
// =========================================================
const createBooking = async (req, res) => {
    try {
        const {
            user,
            pickupLocation,
            dropLocation,
            bookingDate,
            fare,
        } = req.body;

        // ---------------------------------------------
        // Validate user
        // ---------------------------------------------
        const rider = await User.findById(user);

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ---------------------------------------------
        // Create initial booking data
        // ---------------------------------------------
        const bookingData = {
            user,
            pickupLocation,
            dropLocation,
            bookingDate,
            fare,
        };

        // =================================================
        // FEMALE RIDER
        // =================================================
        if (rider.gender === "female") {
            bookingData.womenSafety = true;

            // First search for female driver
            const femaleDriver = await findAvailableDriver(
                "female",
                bookingDate
            );

            // ---------------------------------------------
            // Female driver available
            // ---------------------------------------------
            if (femaleDriver) {
                bookingData.driver = femaleDriver._id;
                bookingData.status = "accepted";
                bookingData.maleDriverConsent = "not_required";

                const booking = new Booking(bookingData);
                const savedBooking = await booking.save();

                return res.status(201).json({
                    success: true,
                    message:
                        "Booking created and female driver assigned successfully.",
                    womenSafety: {
                        enabled: true,
                        femaleDriverAssigned: true,
                        maleDriverConsent: "not_required",
                    },
                    data: savedBooking,
                });
            }

            // ---------------------------------------------
            // No female driver available
            // ---------------------------------------------
            bookingData.driver = null;
            bookingData.status = "pending";
            bookingData.maleDriverConsent = "pending";

            const booking = new Booking(bookingData);
            const savedBooking = await booking.save();

            // Create notification
            await Notification.create({
                user: rider._id,
                title: "Female Driver Unavailable",
                message:
                    "No female driver is currently available for your requested time. Would you be comfortable with an approved male driver? Please choose Yes or No.",
                type: "ride",
                isRead: false,
            });

            return res.status(201).json({
                success: true,
                message:
                    "No female driver is currently available. Your permission is required before assigning a male driver.",
                womenSafety: {
                    enabled: true,
                    femaleDriverAssigned: false,
                    maleDriverConsent: "pending",
                },
                data: savedBooking,
            });
        }


        // =================================================
        // MALE / OTHER RIDER
        // =================================================

        const driver = await findAvailableDriver(
            "male",
            bookingDate
        );

        if (driver) {
            bookingData.driver = driver._id;
            bookingData.status = "accepted";
        } else {
            bookingData.driver = null;
            bookingData.status = "pending";
        }

        bookingData.womenSafety = false;
        bookingData.maleDriverConsent = "not_required";

        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();

        return res.status(201).json({
            success: true,
            message: driver
                ? "Booking created and driver assigned successfully."
                : "Booking created. No driver is currently available.",
            data: savedBooking,
        });

    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message,
        });
    }
};


// =========================================================
// WOMEN DRIVER CONSENT
// =========================================================
const updateWomenDriverConsent = async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;

        // ---------------------------------------------
        // Validate consent
        // ---------------------------------------------
        if (!["accepted", "declined"].includes(consent)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid consent. Use 'accepted' or 'declined'.",
            });
        }

        // ---------------------------------------------
        // Find booking
        // ---------------------------------------------
        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // ---------------------------------------------
        // Check women safety
        // ---------------------------------------------
        if (!booking.womenSafety) {
            return res.status(400).json({
                success: false,
                message:
                    "This booking does not require women driver consent.",
            });
        }

        // ---------------------------------------------
        // Check current consent state
        // ---------------------------------------------
        if (booking.maleDriverConsent !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    "Male driver consent has already been processed.",
            });
        }


        // =================================================
        // RIDER DECLINED
        // =================================================
        if (consent === "declined") {
            booking.maleDriverConsent = "declined";
            booking.consentAt = new Date();

            await booking.save();

            await Notification.create({
                user: booking.user,
                title: "Male Driver Declined",
                message:
                    "You declined a male driver. Your booking will remain pending until a female driver becomes available.",
                type: "ride",
                isRead: false,
            });

            return res.status(200).json({
                success: true,
                message:
                    "Male driver will not be assigned. Booking remains pending for a female driver.",
                data: booking,
            });
        }


        // =================================================
        // RIDER ACCEPTED
        // =================================================

        booking.maleDriverConsent = "accepted";
        booking.consentAt = new Date();

        // Find approved + available male driver
        const maleDriver = await findAvailableDriver(
            "male",
            booking.bookingDate
        );

        // ---------------------------------------------
        // Male driver also unavailable
        // ---------------------------------------------
        if (!maleDriver) {
            await booking.save();

            await Notification.create({
                user: booking.user,
                title: "Driver Currently Unavailable",
                message:
                    "Thank you for your permission. However, no approved male driver is currently available for your requested time. Your booking will remain pending.",
                type: "ride",
                isRead: false,
            });

            return res.status(200).json({
                success: true,
                message:
                    "Permission received, but no male driver is currently available.",
                data: booking,
            });
        }


        // ---------------------------------------------
        // Assign male driver
        // ---------------------------------------------
        booking.driver = maleDriver._id;
        booking.status = "accepted";

        await booking.save();

        // Notify rider
        await Notification.create({
            user: booking.user,
            title: "Male Driver Assigned",
            message:
                "You gave permission for a male driver and an approved available driver has been assigned to your booking.",
            type: "ride",
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            message:
                "Permission received. Male driver assigned successfully.",
            data: booking,
        });

    } catch (error) {
        console.error(
            "Women driver consent error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process women driver consent",
            error: error.message,
        });
    }
};


// =========================================================
// GET ALL BOOKINGS
// =========================================================
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email phone gender")
            .populate("driver");

        res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            data: bookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};


// =========================================================
// GET BOOKING BY ID
// =========================================================
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("user", "name email phone gender")
            .populate("driver");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: booking,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid booking ID",
            error: error.message,
        });
    }
};


// =========================================================
// UPDATE BOOKING
// =========================================================
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update booking",
            error: error.message,
        });
    }
};


// =========================================================
// DELETE BOOKING
// =========================================================
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(
            req.params.id
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
            data: booking,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message,
        });
    }
};


module.exports = {
    createBooking,
    updateWomenDriverConsent,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
};