const Booking = require("../models/Booking");
const User = require("../models/User");
const Driver = require("../models/Driver");
const DriverAvailability = require("../models/DriverAvailability");
const Notification = require("../models/Notification");
const Vehicle = require("../models/Vehicle");
const Payment = require("../models/Payment");

const { calculateRoute } = require("../services/googleRoutesService");
const { calculateFare } = require("../services/fareService");

/**
 * Convert "HH:MM" string to minutes from midnight
 */
const timeToMinutes = (time) => {
    if (!time || typeof time !== "string") return null;
    const parts = time.split(":").map(Number);
    if (parts.length < 2) return null;
    const [hours, minutes] = parts;
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

/**
 * Check if a driver is available on a given booking Date
 */
const isDriverAvailable = async (driverId, bookingDate) => {
    const booking = new Date(bookingDate);
    if (Number.isNaN(booking.getTime())) {
        return false;
    }

    // Get date boundaries in UTC and local day range (+/- 1 day to be safe with timezone)
    const bookingDateString = booking.toISOString().split("T")[0];
    const startOfDay = new Date(`${bookingDateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${bookingDateString}T23:59:59.999Z`);

    const availabilities = await DriverAvailability.find({
        driver: driverId,
        isAvailable: true,
        date: {
            $gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000),
            $lte: new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000),
        },
    });

    if (!availabilities || availabilities.length === 0) {
        return false;
    }

    // Booking minutes (using local/UTC time)
    const bookingMinutes = booking.getUTCHours() * 60 + booking.getUTCMinutes();
    const bookingMinutesLocal = booking.getHours() * 60 + booking.getMinutes();

    for (const availability of availabilities) {
        const startMinutes = timeToMinutes(availability.startTime);
        const endMinutes = timeToMinutes(availability.endTime);

        if (startMinutes === null || endMinutes === null) {
            continue;
        }

        // Check if booking falls within start and end time
        if (
            (bookingMinutes >= startMinutes && bookingMinutes <= endMinutes) ||
            (bookingMinutesLocal >= startMinutes && bookingMinutesLocal <= endMinutes)
        ) {
            return true;
        }
    }

    return false;
};

/**
 * Check if a driver has an overlapping active/scheduled ride
 */
const hasDriverConflict = async (driverId, bookingDate, durationMinutes = 30, excludeBookingId = null) => {
    const reqStart = new Date(bookingDate).getTime();
    const reqDurationMs = Math.max(15, Number(durationMinutes) || 30) * 60 * 1000;
    const reqEnd = reqStart + reqDurationMs;

    // Find any existing active/accepted bookings for this driver
    const query = {
        driver: driverId,
        status: {
            $in: ["accepted", "driver_arriving", "driver_arrived", "ongoing"],
        },
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const existingBookings = await Booking.find(query);

    for (const existing of existingBookings) {
        const existStart = new Date(existing.bookingDate).getTime();
        const existDurationMs =
            Math.max(15, Number(existing.durationMinutes) || 30) * 60 * 1000;
        const existEnd = existStart + existDurationMs;

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (reqStart < existEnd && reqEnd > existStart) {
            return true; // Conflict exists!
        }
    }

    return false;
};

/**
 * Find an eligible available driver
 */
const findAvailableDriver = async ({
    gender = null,
    vehicleType = null,
    bookingDate,
    durationMinutes = 30,
    excludeDriverIds = [],
}) => {
    const drivers = await Driver.find({
        isApproved: true,
        verificationStatus: "approved",
        isOnline: { $ne: false },
        _id: { $nin: excludeDriverIds },
    }).populate("user", "name email phone gender isActive");

    const activeDrivers = drivers.filter(
        (d) => d.user && d.user.isActive !== false
    );

    const genderMatchedDrivers = gender
        ? activeDrivers.filter((d) => d.user.gender === gender)
        : activeDrivers;

    for (const driver of genderMatchedDrivers) {
        // 1. Check Driver Availability schedule
        const isAvailable = await isDriverAvailable(driver._id, bookingDate);
        if (!isAvailable) {
            continue;
        }

        // 2. Check Overlap conflict with other rides
        const conflict = await hasDriverConflict(
            driver._id,
            bookingDate,
            durationMinutes
        );
        if (conflict) {
            continue;
        }

        // 3. (Optional) Check vehicle type match if vehicles exist for this driver
        if (vehicleType) {
            const vehicles = await Vehicle.find({
                driver: driver._id,
                isActive: true,
            });
            if (vehicles.length > 0) {
                const hasMatchingVehicle = vehicles.some(
                    (v) => v.vehicleType === vehicleType
                );
                if (!hasMatchingVehicle) {
                    continue;
                }
            }
        }

        return driver;
    }

    return null;
};

const safeCreateNotification = async (payload) => {
    try {
        await Notification.create(payload);
    } catch (err) {
        console.warn("Notification create warning:", err.message);
    }
};

/**
 * Route Preview & Fare Calculation
 */
const routePreview = async (req, res) => {
    try {
        const {
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            vehicleType,
        } = req.body;

        const coordinates = [
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
        ];

        if (
            coordinates.some(
                (value) =>
                    value === undefined ||
                    value === null ||
                    !Number.isFinite(Number(value))
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid pickup and drop coordinates are required",
            });
        }

        if (!["bike", "auto", "car"].includes(vehicleType)) {
            return res.status(400).json({
                success: false,
                message: "Vehicle type must be bike, auto, or car",
            });
        }

        const route = await calculateRoute(
            {
                latitude: Number(pickupLatitude),
                longitude: Number(pickupLongitude),
            },
            {
                latitude: Number(dropLatitude),
                longitude: Number(dropLongitude),
            }
        );

        const fare = calculateFare(vehicleType, route.distanceKm);

        return res.status(200).json({
            success: true,
            route: {
                distanceKm: route.distanceKm,
                durationMinutes: route.durationMinutes,
                encodedPolyline: route.encodedPolyline,
            },
            fare,
        });
    } catch (error) {
        console.error("Route preview error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate route and fare",
            error: error.message,
        });
    }
};

/**
 * Create a Booking (Rider flow)
 */
const createBooking = async (req, res) => {
    try {
        const {
            pickupLocation,
            pickupLatitude,
            pickupLongitude,
            dropLocation,
            dropLatitude,
            dropLongitude,
            bookingDate,
            vehicleType,
            paymentMethod,
        } = req.body;

        const validPaymentMethod = ["cash", "card", "upi"].includes(paymentMethod)
            ? paymentMethod
            : "cash";

        // Obtain rider directly from authenticated token
        const riderId = req.user._id || req.user.id;
        const rider = await User.findById(riderId);

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        if (!pickupLocation || !dropLocation) {
            return res.status(400).json({
                success: false,
                message: "Pickup and drop locations are required",
            });
        }

        const coordinates = [
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
        ];

        if (
            coordinates.some(
                (val) =>
                    val === undefined ||
                    val === null ||
                    !Number.isFinite(Number(val))
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid pickup and drop coordinates are required",
            });
        }

        if (!["bike", "auto", "car"].includes(vehicleType)) {
            return res.status(400).json({
                success: false,
                message: "Vehicle type must be bike, auto, or car",
            });
        }

        if (!bookingDate) {
            return res.status(400).json({
                success: false,
                message: "Booking date and time is required",
            });
        }

        // =====================================================
        // ADVANCE BOOKING VALIDATION: MAXIMUM 3 DAYS
        // =====================================================
        const requestedDate = new Date(bookingDate);
        if (Number.isNaN(requestedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking date format",
            });
        }

        const now = Date.now();
        const requestedTime = requestedDate.getTime();
        const minAllowedTime = now - 5 * 60 * 1000; // 5 min grace period for clock difference
        const maxAllowedTime = now + 3 * 24 * 60 * 60 * 1000 + 60 * 1000; // 72 hours in future

        if (requestedTime < minAllowedTime) {
            return res.status(400).json({
                success: false,
                message: "Scheduled ride time cannot be in the past",
            });
        }

        if (requestedTime > maxAllowedTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Rides can only be scheduled for today or up to 3 days (72 hours) in advance.",
            });
        }

        // =====================================================
        // CALCULATE ROUTE & FARE (Backend Source of Truth)
        // =====================================================
        const route = await calculateRoute(
            {
                latitude: Number(pickupLatitude),
                longitude: Number(pickupLongitude),
            },
            {
                latitude: Number(dropLatitude),
                longitude: Number(dropLongitude),
            }
        );

        const fare = calculateFare(vehicleType, route.distanceKm);

        const bookingData = {
            user: rider._id,
            pickupLocation: pickupLocation.trim(),
            pickupLatitude: Number(pickupLatitude),
            pickupLongitude: Number(pickupLongitude),
            dropLocation: dropLocation.trim(),
            dropLatitude: Number(dropLatitude),
            dropLongitude: Number(dropLongitude),
            bookingDate: requestedDate,
            scheduledAt: requestedDate,
            vehicleType,
            fare,
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
            routePolyline: route.encodedPolyline,
            driver: null,
            status: "pending",
            paymentMethod: validPaymentMethod,
            paymentStatus: "pending",
            womenSafety: false,
            femaleDriverPreferred: false,
            maleDriverConsent: "not_required",
            consentAt: null,
        };

        // =====================================================
        // WOMEN SAFETY FLOW
        // =====================================================
        if (rider.gender === "female") {
            bookingData.womenSafety = true;
            bookingData.femaleDriverPreferred = true;

            // Check if any female drivers exist/are online
            const femaleDriver = await findAvailableDriver({
                gender: "female",
                vehicleType,
                bookingDate: requestedDate,
                durationMinutes: route.durationMinutes,
            });

            if (femaleDriver) {
                // Female driver is available: create booking as pending for female driver(s) to accept
                bookingData.driver = null;
                bookingData.status = "pending";
                bookingData.maleDriverConsent = "not_required";

                const booking = await Booking.create(bookingData);
                try {
                    await Payment.create({
                        booking: booking._id,
                        user: rider._id,
                        amount: fare,
                        paymentMethod: validPaymentMethod,
                        paymentStatus: "pending",
                    });
                } catch (payErr) {
                    console.warn("Payment record creation warning:", payErr.message);
                }

                const populatedBooking = await Booking.findById(booking._id).populate(
                    "user",
                    "name email phone gender"
                );

                await safeCreateNotification({
                    user: rider._id,
                    title: "Ride Requested (Women Safety)",
                    message: `Your ride request has been dispatched to female drivers. Searching for female driver...`,
                    type: "women_safety",
                    relatedBooking: booking._id,
                });

                return res.status(201).json({
                    success: true,
                    message: "Booking created. Request dispatched to available female drivers.",
                    womenSafety: {
                        enabled: true,
                        femaleDriverAssigned: false,
                        maleDriverConsent: "not_required",
                    },
                    route: {
                        distanceKm: route.distanceKm,
                        durationMinutes: route.durationMinutes,
                        encodedPolyline: route.encodedPolyline,
                    },
                    fare,
                    data: populatedBooking,
                });
            }

            // 2. Female driver UNAVAILABLE: Ask female customer for explicit consent
            bookingData.driver = null;
            bookingData.status = "pending";
            bookingData.maleDriverConsent = "pending";

            const booking = await Booking.create(bookingData);
            try {
                await Payment.create({
                    booking: booking._id,
                    user: rider._id,
                    amount: fare,
                    paymentMethod: validPaymentMethod,
                    paymentStatus: "pending",
                });
            } catch (payErr) {
                console.warn("Payment record creation warning:", payErr.message);
            }

            const populatedBooking = await Booking.findById(booking._id).populate(
                "user",
                "name email phone gender"
            );

            // Notify female rider that female driver is unavailable and asking for consent
            await safeCreateNotification({
                user: rider._id,
                title: "Female Driver Unavailable",
                message:
                    "No female driver is currently available for your scheduled time. Would you be comfortable with an approved male driver?",
                type: "women_safety",
                relatedBooking: booking._id,
            });

            return res.status(201).json({
                success: true,
                message:
                    "No female driver is currently available. Your consent is required before assigning a male driver.",
                womenSafety: {
                    enabled: true,
                    femaleDriverAssigned: false,
                    maleDriverConsent: "pending",
                },
                route: {
                    distanceKm: route.distanceKm,
                    durationMinutes: route.durationMinutes,
                    encodedPolyline: route.encodedPolyline,
                },
                fare,
                data: populatedBooking,
            });
        }

        // =====================================================
        // NORMAL RIDER (Male/Other) FLOW
        // =====================================================
        bookingData.womenSafety = false;
        bookingData.maleDriverConsent = "not_required";
        bookingData.driver = null;
        bookingData.status = "pending";

        const booking = await Booking.create(bookingData);
        try {
            await Payment.create({
                booking: booking._id,
                user: rider._id,
                amount: fare,
                paymentMethod: validPaymentMethod,
                paymentStatus: "pending",
            });
        } catch (payErr) {
            console.warn("Payment record creation warning:", payErr.message);
        }

        const populatedBooking = await Booking.findById(booking._id).populate(
            "user",
            "name email phone gender"
        );

        await safeCreateNotification({
            user: rider._id,
            title: "Ride Requested",
            message:
                "Your ride request is pending. We will notify you once an eligible driver accepts.",
            type: "ride",
            relatedBooking: booking._id,
        });

        return res.status(201).json({
            success: true,
            message: "Booking created successfully. Searching for available drivers.",
            womenSafety: {
                enabled: false,
                maleDriverConsent: "not_required",
            },
            route: {
                distanceKm: route.distanceKm,
                durationMinutes: route.durationMinutes,
                encodedPolyline: route.encodedPolyline,
            },
            fare,
            data: populatedBooking,
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

/**
 * Handle Women Safety Male-Driver Consent
 */
const updateWomenDriverConsent = async (req, res) => {
    try {
        const { id } = req.params;
        const { consent } = req.body;

        if (!["accepted", "declined"].includes(consent)) {
            return res.status(400).json({
                success: false,
                message: "Invalid consent value. Must be 'accepted' or 'declined'.",
            });
        }

        const booking = await Booking.findById(id).populate(
            "user",
            "name email phone gender isActive"
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Authorization check: must be the booking's rider or admin
        if (
            req.user.role !== "admin" &&
            booking.user._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update consent for this booking.",
            });
        }

        if (!booking.user || booking.user.gender !== "female") {
            return res.status(403).json({
                success: false,
                message: "Male-driver consent is only applicable for female riders.",
            });
        }

        if (!booking.womenSafety) {
            return res.status(400).json({
                success: false,
                message: "Women safety is not active for this booking.",
            });
        }

        if (booking.maleDriverConsent !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Male driver consent is already '${booking.maleDriverConsent}'.`,
            });
        }

        // Case 1: Female customer declined male driver
        if (consent === "declined") {
            booking.maleDriverConsent = "declined";
            booking.consentAt = new Date();
            booking.driver = null;
            booking.status = "pending";

            await booking.save();

            await Notification.create({
                user: booking.user._id,
                title: "Male Driver Declined",
                message:
                    "You declined a male driver. Your booking will remain pending for a female driver.",
                type: "women_safety",
                relatedBooking: booking._id,
            });

            const populated = await Booking.findById(booking._id).populate(
                "user",
                "name email phone gender"
            );

            return res.status(200).json({
                success: true,
                message:
                    "Male driver will not be assigned. Booking remains pending for an available female driver.",
                data: populated,
            });
        }

        // Case 2: Female customer accepted male driver
        booking.maleDriverConsent = "accepted";
        booking.consentAt = new Date();

        // Search for eligible male driver
        const maleDriver = await findAvailableDriver({
            gender: "male",
            vehicleType: booking.vehicleType,
            bookingDate: booking.bookingDate,
            durationMinutes: booking.durationMinutes,
        });

        if (!maleDriver) {
            await booking.save();

            await Notification.create({
                user: booking.user._id,
                title: "Driver Search Ongoing",
                message:
                    "Consent received for male driver. We are currently searching for an available driver.",
                type: "women_safety",
                relatedBooking: booking._id,
            });

            const populated = await Booking.findById(booking._id).populate(
                "user",
                "name email phone gender"
            );

            return res.status(200).json({
                success: true,
                message:
                    "Consent received. Searching for an available male driver.",
                data: populated,
            });
        }

        booking.driver = maleDriver._id;
        booking.status = "accepted";
        await booking.save();

        await Notification.create({
            user: booking.user._id,
            title: "Male Driver Assigned",
            message: `You allowed a male driver, and ${maleDriver.user.name} has been assigned to your ride.`,
            type: "women_safety",
            relatedBooking: booking._id,
        });

        await Notification.create({
            user: maleDriver.user._id,
            title: "New Ride Assigned",
            message: `You have been assigned a scheduled ride from ${booking.pickupLocation} to ${booking.dropLocation}.`,
            type: "ride",
            relatedBooking: booking._id,
        });

        const populated = await Booking.findById(booking._id)
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        return res.status(200).json({
            success: true,
            message: "Consent received. Male driver assigned successfully.",
            data: populated,
        });
    } catch (error) {
        console.error("Women driver consent error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process women driver consent",
            error: error.message,
        });
    }
};

/**
 * Get Bookings (Filtered by role and authenticated user)
 */
const getBookings = async (req, res) => {
    try {
        let filter = {};

        // If rider: ONLY return rider's own bookings
        if (req.user.role === "rider") {
            filter.user = req.user._id;
        } else if (req.user.role === "driver") {
            // If driver: find driver document
            const driver = await Driver.findOne({ user: req.user._id });
            if (driver) {
                filter.driver = driver._id;
            } else {
                return res.status(200).json({
                    success: true,
                    message: "No driver profile found",
                    data: [],
                });
            }
        }
        // Admin sees all (or can pass query filters)
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const bookings = await Booking.find(filter)
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            })
            .sort({ bookingDate: -1, createdAt: -1 });

        // Populate driver vehicles if driver is assigned
        const driverIds = bookings
            .filter((b) => b.driver && b.driver._id)
            .map((b) => b.driver._id);

        let formattedBookings = bookings;
        if (driverIds.length > 0) {
            const vehicles = await Vehicle.find({
                driver: { $in: driverIds },
                isActive: true,
            });
            const vehicleMap = {};
            vehicles.forEach((v) => {
                vehicleMap[v.driver.toString()] = v;
            });

            formattedBookings = bookings.map((b) => {
                const bObj = b.toObject ? b.toObject() : { ...b };
                if (bObj.driver && bObj.driver._id && vehicleMap[bObj.driver._id.toString()]) {
                    bObj.driver.vehicle = vehicleMap[bObj.driver._id.toString()];
                }
                return bObj;
            });
        }

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            data: formattedBookings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};

/**
 * Get Booking By ID
 */
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Authorization check
        if (req.user.role === "rider") {
            if (booking.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this booking.",
                });
            }
        } else if (req.user.role === "driver") {
            const driver = await Driver.findOne({ user: req.user._id });
            if (
                !driver ||
                (!booking.driver ||
                    booking.driver._id.toString() !== driver._id.toString())
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this booking.",
                });
            }
        }

        const bObj = booking.toObject ? booking.toObject() : { ...booking };
        if (bObj.driver && bObj.driver._id) {
            const vehicle = await Vehicle.findOne({
                driver: bObj.driver._id,
                isActive: true,
            });
            if (vehicle) {
                bObj.driver.vehicle = vehicle;
            }
        }

        return res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            data: bObj,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking ID",
            error: error.message,
        });
    }
};

/**
 * Update Booking Lifecycle Status (driver_arriving, ongoing, completed, cancelled)
 */
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;

        const validStatuses = [
            "pending",
            "accepted",
            "driver_arriving",
            "driver_arrived",
            "ongoing",
            "completed",
            "cancelled",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status '${status}'`,
            });
        }

        const booking = await Booking.findById(id).populate(
            "user",
            "name email phone gender"
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Validate state transitions
        if (booking.status === "completed" && status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed rides cannot be modified.",
            });
        }

        if (booking.status === "cancelled" && status !== "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled rides cannot be updated.",
            });
        }

        // Advance booking start protection: Driver cannot start a future ride more than 15 mins before scheduled time
        const activeStatuses = ["driver_arriving", "driver_arrived", "ongoing", "completed"];
        if (activeStatuses.includes(status)) {
            const scheduledTime = new Date(
                booking.scheduledAt || booking.bookingDate
            ).getTime();
            const now = Date.now();
            const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

            if (scheduledTime - now > FIFTEEN_MINUTES_MS) {
                const formattedDate = new Date(booking.bookingDate).toLocaleString(
                    "en-IN",
                    {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }
                );
                return res.status(400).json({
                    success: false,
                    message: `This ride is scheduled for ${formattedDate}. You can start or update this ride only at or within 15 minutes of the scheduled time.`,
                });
            }
        }

        booking.status = status;
        if (status === "cancelled" && cancellationReason) {
            booking.cancellationReason = cancellationReason;
        }

        await booking.save();

        // Increment driver totalRides if completed
        if (status === "completed" && booking.driver) {
            await Driver.findByIdAndUpdate(booking.driver, {
                $inc: { totalRides: 1 },
            });
        }

        // Notify rider of status change
        const statusMessages = {
            driver_arriving: "Your driver is on the way to your pickup location.",
            driver_arrived: "Your driver has arrived at the pickup location.",
            ongoing: "Your trip has started. Have a safe journey!",
            completed: `Your trip is completed. Total fare: ₹${booking.fare}.`,
            cancelled: `Your booking was cancelled.${
                cancellationReason ? " Reason: " + cancellationReason : ""
            }`,
        };

        if (statusMessages[status] && booking.user) {
            await Notification.create({
                user: booking.user._id,
                title: `Ride ${status.replace("_", " ").toUpperCase()}`,
                message: statusMessages[status],
                type: "ride",
                relatedBooking: booking._id,
            });
        }

        const updatedBooking = await Booking.findById(id)
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        return res.status(200).json({
            success: true,
            message: `Booking status updated to '${status}' successfully.`,
            data: updatedBooking,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update booking status",
            error: error.message,
        });
    }
};

/**
 * Update Booking (Admin/Generic)
 */
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to update booking",
            error: error.message,
        });
    }
};

/**
 * Delete Booking
 */
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
            data: booking,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message,
        });
    }
};

/**
 * Driver Pending Bookings (Filtered with women-safety and availability check)
 * FIXED: Instant rides (within 2 hours) no longer require DriverAvailability records.
 * Scheduled rides still check DriverAvailability but failure only filters, not blocks.
 */
const getDriverPendingBookings = async (req, res) => {
    try {
        const driverUserId = req.params.userId || req.user._id;

        const driver = await Driver.findOne({
            user: driverUserId,
            isApproved: true,
            verificationStatus: "approved",
        }).populate("user", "name email phone gender isActive");

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Approved driver profile not found. Make sure your driver account is approved by admin.",
            });
        }

        const driverGender = driver.user?.gender || "male";

        // Get driver's vehicle types for filtering
        const driverVehicles = await Vehicle.find({
            driver: driver._id,
            isActive: true,
        });
        const driverVehicleTypes = driverVehicles.map((v) => v.vehicleType);

        // Find pending bookings without an assigned driver
        // Also exclude bookings this driver already rejected
        const pendingBookings = await Booking.find({
            status: "pending",
            driver: null,
            // Exclude bookings rejected by this driver
            rejectedBy: { $nin: [driver._id] },
        })
            .populate("user", "name email phone gender")
            .sort({ bookingDate: 1 });

        const now = Date.now();
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

        // Filter eligible bookings based on women-safety rules, availability, and overlap
        const eligibleBookings = [];

        for (const booking of pendingBookings) {
            const riderGender = booking.user?.gender || "other";

            // Women safety rules:
            // If rider is female and consent is pending, male drivers CANNOT see it!
            if (riderGender === "female") {
                if (driverGender === "male") {
                    // Only allowed if female customer explicitly accepted male driver
                    if (booking.maleDriverConsent !== "accepted") {
                        continue;
                    }
                }
            }

            // Vehicle type matching: only skip if driver has vehicles and none match
            if (driverVehicleTypes.length > 0 && booking.vehicleType) {
                if (!driverVehicleTypes.includes(booking.vehicleType)) {
                    continue;
                }
            }

            const bookingTime = new Date(booking.bookingDate).getTime();
            const isInstantRide = bookingTime - now < TWO_HOURS_MS;

            if (!isInstantRide) {
                // If driver has specific availability slots set, ensure booking fits
                const hasSchedules = await DriverAvailability.exists({
                    driver: driver._id,
                    isAvailable: true,
                });
                if (hasSchedules) {
                    const available = await isDriverAvailable(
                        driver._id,
                        booking.bookingDate
                    );
                    if (!available) {
                        continue;
                    }
                }
            }
            // For instant rides: online drivers are always eligible

            // Check if driver has an overlapping active/accepted ride
            const conflict = await hasDriverConflict(
                driver._id,
                booking.bookingDate,
                booking.durationMinutes
            );
            if (conflict) {
                continue;
            }

            eligibleBookings.push(booking);
        }

        return res.status(200).json({
            success: true,
            data: eligibleBookings,
        });
    } catch (error) {
        console.error("Get driver pending bookings error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending ride requests",
            error: error.message,
        });
    }
};

/**
 * Driver accepts a pending booking
 */
const acceptBookingByDriver = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const driverUserId = req.params.userId || req.user._id;

        const driver = await Driver.findOne({
            user: driverUserId,
            isApproved: true,
            verificationStatus: "approved",
        }).populate("user", "name email phone gender isActive");

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Approved driver profile not found",
            });
        }

        const booking = await Booking.findById(bookingId).populate(
            "user",
            "name email phone gender"
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.status !== "pending" || booking.driver) {
            return res.status(400).json({
                success: false,
                message:
                    "This booking has already been assigned or is no longer pending.",
            });
        }

        // Women Safety validation: if rider is female and driver is male, ensure consent is accepted
        if (
            booking.user?.gender === "female" &&
            driver.user?.gender === "male" &&
            booking.maleDriverConsent !== "accepted"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Cannot accept this ride: female rider has not consented to a male driver.",
            });
        }

        // Check overlap conflict
        const conflict = await hasDriverConflict(
            driver._id,
            booking.bookingDate,
            booking.durationMinutes
        );
        if (conflict) {
            return res.status(400).json({
                success: false,
                message:
                    "You already have an active/accepted ride overlapping with this time.",
            });
        }

        // Atomic update to avoid race conditions
        const updatedBooking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                status: "pending",
                driver: null,
            },
            {
                $set: {
                    driver: driver._id,
                    status: "accepted",
                    acceptedAt: new Date(),
                },
            },
            {
                new: true,
            }
        )
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        if (!updatedBooking) {
            return res.status(400).json({
                success: false,
                message:
                    "This ride was just accepted by another driver or is no longer available.",
            });
        }

        // Notify rider
        await Notification.create({
            user: booking.user._id,
            title: "Ride Accepted",
            message: `Your ride has been accepted by ${driver.user.name}.`,
            type: "ride",
            relatedBooking: updatedBooking._id,
        });

        return res.status(200).json({
            success: true,
            message: "Ride accepted successfully.",
            data: updatedBooking,
        });
    } catch (error) {
        console.error("Accept booking error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to accept ride",
            error: error.message,
        });
    }
};

/**
 * Driver rejects/passes on a pending booking (adds driver to rejectedBy so they won't see it again)
 */
const rejectBookingByDriver = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const driverUserId = req.user._id;

        const driver = await Driver.findOne({
            user: driverUserId,
            isApproved: true,
            verificationStatus: "approved",
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status !== "pending") {
            return res.status(404).json({
                success: false,
                message: "Booking not found or no longer pending",
            });
        }

        // Add driver to rejectedBy so they don't see it again
        await Booking.findByIdAndUpdate(bookingId, {
            $addToSet: { rejectedBy: driver._id },
        });

        return res.status(200).json({
            success: true,
            message: "Ride request passed successfully.",
        });
    } catch (error) {
        console.error("Reject booking error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to pass on ride",
            error: error.message,
        });
    }
};

/**
 * Assign pending bookings when a driver updates their availability
 */
const assignPendingBookingsForDriver = async (driverId) => {
    try {
        const driver = await Driver.findById(driverId).populate(
            "user",
            "name email phone gender isActive"
        );

        if (
            !driver ||
            !driver.isApproved ||
            driver.verificationStatus !== "approved" ||
            !driver.user ||
            driver.user.isActive === false
        ) {
            return 0;
        }

        const pendingBookings = await Booking.find({
            status: "pending",
            driver: null,
        })
            .populate("user", "name email phone gender isActive")
            .sort({ bookingDate: 1 });

        let assignedCount = 0;

        for (const booking of pendingBookings) {
            if (!booking.user) continue;

            const isAvailable = await isDriverAvailable(
                driver._id,
                booking.bookingDate
            );
            if (!isAvailable) continue;

            const hasConflict = await hasDriverConflict(
                driver._id,
                booking.bookingDate,
                booking.durationMinutes
            );
            if (hasConflict) continue;

            const riderGender = booking.user.gender;
            const driverGender = driver.user.gender;

            let eligible = false;

            if (riderGender === "female") {
                if (driverGender === "female") {
                    eligible = true;
                } else if (
                    driverGender === "male" &&
                    booking.maleDriverConsent === "accepted"
                ) {
                    eligible = true;
                }
            } else {
                eligible = true;
            }

            if (!eligible) continue;

            const assigned = await Booking.findOneAndUpdate(
                {
                    _id: booking._id,
                    status: "pending",
                    driver: null,
                },
                {
                    $set: {
                        driver: driver._id,
                        status: "accepted",
                    },
                },
                {
                    new: true,
                }
            );

            if (!assigned) continue;

            assignedCount++;

            await Notification.create({
                user: booking.user._id,
                title: "Driver Assigned",
                message: `Your scheduled ride has been assigned to ${driver.user.name}.`,
                type: "ride",
                relatedBooking: booking._id,
            });

            await Notification.create({
                user: driver.user._id,
                title: "New Ride Assigned",
                message: `A scheduled ride from ${booking.pickupLocation} to ${booking.dropLocation} has been assigned to you.`,
                type: "ride",
                relatedBooking: booking._id,
            });
        }

        return assignedCount;
    } catch (error) {
        console.error("assignPendingBookingsForDriver error:", error);
        return 0;
    }
};

module.exports = {
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
    assignPendingBookingsForDriver,
};