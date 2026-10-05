const Booking = require("../models/booking");
const User = require("../models/user");
const Driver = require("../models/driver");
const DriverAvailability = require("../models/driverAvailability");
const Notification = require("../models/notification");

const {
    calculateRoute,
} = require("../services/googleRoutesService");

const {
    calculateFare,
} = require("../services/fareService");
const timeToMinutes = (time) => {
    if (!time) return null;

    const [hours, minutes] =
        time.split(":").map(Number);

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
const isDriverAvailable = async (
    driverId,
    bookingDate
) => {
    const booking = new Date(bookingDate);

    if (Number.isNaN(booking.getTime())) {
        return false;
    }

    const bookingDateString =
        booking.toISOString().split("T")[0];

    const startOfDay = new Date(
        `${bookingDateString}T00:00:00.000Z`
    );

    const endOfDay = new Date(
        `${bookingDateString}T23:59:59.999Z`
    );

    const availabilities =
        await DriverAvailability.find({
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
        booking.getUTCHours() * 60 +
        booking.getUTCMinutes();

    for (const availability of availabilities) {
        const startMinutes =
            timeToMinutes(
                availability.startTime
            );

        const endMinutes =
            timeToMinutes(
                availability.endTime
            );

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
const findAvailableDriver = async (
    gender,
    bookingDate
) => {
    const drivers = await Driver.find({
        isApproved: true,

        verificationStatus: "approved",
    }).populate(
        "user",
        "name email phone gender isActive"
    );

    const genderMatchedDrivers =
        drivers.filter(
            (driver) =>
                driver.user &&
                driver.user.gender === gender &&
                driver.user.isActive !== false
        );

    for (const driver of genderMatchedDrivers) {
        const available =
            await isDriverAvailable(
                driver._id,
                bookingDate
            );

        if (available) {
            return driver;
        }
    }

    return null;
};
const createBooking = async (req, res) => {
    try {
        const {
            user,
            pickupLocation,
            pickupLatitude,
            pickupLongitude,
            dropLocation,
            dropLatitude,
            dropLongitude,
            bookingDate,
            vehicleType,
        } = req.body;
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is required",
            });
        }

        if (
            !pickupLocation ||
            !dropLocation
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Pickup and drop locations are required",
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
                (value) =>
                    !Number.isFinite(
                        Number(value)
                    )
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid pickup and drop coordinates are required",
            });
        }

        if (
            !["bike", "auto", "car"].includes(
                vehicleType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Vehicle type must be bike, auto or car",
            });
        }
        if (!bookingDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Booking date is required",
            });
        }
        const rider =
            await User.findById(user);

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const route =
            await calculateRoute(
                {
                    latitude:
                        pickupLatitude,

                    longitude:
                        pickupLongitude,
                },

                {
                    latitude:
                        dropLatitude,

                    longitude:
                        dropLongitude,
                }
            );
        const fare =
            calculateFare(
                vehicleType,
                route.distanceKm
            );
        const bookingData = {
            user: rider._id,

            pickupLocation,

            pickupLatitude:
                Number(pickupLatitude),

            pickupLongitude:
                Number(pickupLongitude),

            dropLocation,

            dropLatitude:
                Number(dropLatitude),

            dropLongitude:
                Number(dropLongitude),

            bookingDate,

            vehicleType,

            fare,

            distanceKm:
                route.distanceKm,

            durationMinutes:
                route.durationMinutes,

            routePolyline:
                route.encodedPolyline,

            driver: null,

            status: "pending",

            womenSafety: false,

            maleDriverConsent:
                "not_required",
        };
        if (rider.gender === "female") {
            bookingData.womenSafety = true;
            const femaleDriver =
                await findAvailableDriver(
                    "female",
                    bookingDate
                );
            if (femaleDriver) {
                bookingData.driver =
                    femaleDriver._id;

                bookingData.status =
                    "accepted";

                bookingData.maleDriverConsent =
                    "not_required";

                const booking =
                    new Booking(
                        bookingData
                    );

                const savedBooking =
                    await booking.save();

                return res.status(201).json({
                    success: true,

                    message:
                        "Booking created and female driver assigned successfully.",

                    womenSafety: {
                        enabled: true,

                        femaleDriverAssigned:
                            true,

                        maleDriverConsent:
                            "not_required",
                    },

                    route: {
                        distanceKm:
                            route.distanceKm,

                        durationMinutes:
                            route.durationMinutes,
                    },

                    fare,

                    data:
                        savedBooking,
                });
            }
            bookingData.driver = null;

            bookingData.status =
                "pending";

            bookingData.maleDriverConsent =
                "pending";


            const booking =
                new Booking(
                    bookingData
                );

            const savedBooking =
                await booking.save();


            await Notification.create({
                user: rider._id,

                title:
                    "Female Driver Unavailable",

                message:
                    "No female driver is currently available. Would you like to allow an approved male driver?",

                type: "ride",

                relatedRide: null,

                isRead: false,
            });


            return res.status(201).json({
                success: true,

                message:
                    "No female driver is currently available. Your permission is required before assigning a male driver.",

                womenSafety: {
                    enabled: true,

                    femaleDriverAssigned:
                        false,

                    maleDriverConsent:
                        "pending",
                },

                route: {
                    distanceKm:
                        route.distanceKm,

                    durationMinutes:
                        route.durationMinutes,
                },

                fare,

                data:
                    savedBooking,
            });
        }
        bookingData.womenSafety =
            false;

        bookingData.maleDriverConsent =
            "not_required";


        /*
         * For normal riders we currently
         * use a male driver, matching your
         * existing booking logic.
         */
        const driver =
            await findAvailableDriver(
                "male",
                bookingDate
            );


        if (driver) {
            bookingData.driver =
                driver._id;

            bookingData.status =
                "accepted";
        } else {
            bookingData.driver = null;

            bookingData.status =
                "pending";
        }


        const booking =
            new Booking(
                bookingData
            );

        const savedBooking =
            await booking.save();


        return res.status(201).json({
            success: true,

            message: driver
                ? "Booking created and driver assigned successfully."
                : "Booking created. No driver is currently available.",

            womenSafety: {
                enabled: false,

                maleDriverConsent:
                    "not_required",
            },

            route: {
                distanceKm:
                    route.distanceKm,

                durationMinutes:
                    route.durationMinutes,
            },

            fare,

            data:
                savedBooking,
        });

    } catch (error) {
        console.error(
            "Create booking error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to create booking",

            error:
                error.message,
        });
    }
};
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
                    !Number.isFinite(Number(value))
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid pickup and drop coordinates are required",
            });
        }

        if (
            !["bike", "auto", "car"].includes(
                vehicleType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Vehicle type must be bike, auto or car",
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

        const fare = calculateFare(
            vehicleType,
            route.distanceKm
        );

        return res.status(200).json({
            success: true,
            route: {
                distanceKm: route.distanceKm,
                durationMinutes:
                    route.durationMinutes,
            },
            fare,
        });
    } catch (error) {
        console.error(
            "Route preview error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to calculate route and fare",
            error: error.message,
        });
    }
};
const updateWomenDriverConsent =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const { consent } =
                req.body;
            if (
                !["accepted", "declined"]
                    .includes(consent)
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Invalid consent. Use 'accepted' or 'declined'.",
                });
            }
            const booking =
                await Booking.findById(id)
                    .populate(
                        "user",
                        "name email phone gender isActive"
                    );
            if (!booking) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Booking not found",
                });
            }
            if (
                !booking.user ||
                booking.user.gender !==
                    "female"
            ) {
                return res.status(403).json({
                    success: false,

                    message:
                        "Male-driver consent is available only for female riders.",
                });
            }
            if (
                !booking.womenSafety
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Women safety is not active for this booking.",
                });
            }
            if (
                booking.maleDriverConsent !==
                "pending"
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Male driver consent has already been processed.",
                });
            }
            if (consent === "declined") {
                booking.maleDriverConsent =
                    "declined";

                booking.consentAt =
                    new Date();

                await booking.save();


                await Notification.create({
                    user:
                        booking.user._id,

                    title:
                        "Male Driver Declined",

                    message:
                        "You declined a male driver. Your booking will remain pending until a female driver becomes available.",

                    type: "ride",

                    isRead: false,
                });


                return res.status(200).json({
                    success: true,

                    message:
                        "Male driver will not be assigned. Booking remains pending for a female driver.",

                    data:
                        booking,
                });
            }
            booking.maleDriverConsent =
                "accepted";

            booking.consentAt =
                new Date();


            const maleDriver =
                await findAvailableDriver(
                    "male",
                    booking.bookingDate
                );


            if (!maleDriver) {
                await booking.save();


                await Notification.create({
                    user:
                        booking.user._id,

                    title:
                        "Driver Currently Unavailable",

                    message:
                        "Permission received, but no approved male driver is currently available. Your booking will remain pending.",

                    type: "ride",

                    isRead: false,
                });


                return res.status(200).json({
                    success: true,

                    message:
                        "Permission received, but no male driver is currently available.",

                    data:
                        booking,
                });
            }
            booking.driver =
                maleDriver._id;

            booking.status =
                "accepted";


            await booking.save();


            await Notification.create({
                user:
                    booking.user._id,

                title:
                    "Male Driver Assigned",

                message:
                    "You gave permission for a male driver and an approved available driver has been assigned.",

                type: "ride",

                isRead: false,
            });


            return res.status(200).json({
                success: true,

                message:
                    "Permission received. Male driver assigned successfully.",

                data:
                    booking,
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

                error:
                    error.message,
            });
        }
    };
const getBookings = async (
    req,
    res
) => {
    try {
        const bookings =
            await Booking.find()
                .populate(
                    "user",
                    "name email phone gender"
                )
                .populate("driver");

        return res.status(200).json({
            success: true,

            message:
                "Bookings fetched successfully",

            data:
                bookings,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,

            message:
                "Failed to fetch bookings",

            error:
                error.message,
        });
    }
};
const getBookingById =
    async (req, res) => {
        try {
            const booking =
                await Booking.findById(
                    req.params.id
                )
                    .populate(
                        "user",
                        "name email phone gender"
                    )
                    .populate("driver");


            if (!booking) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Booking not found",
                });
            }


            return res.status(200).json({
                success: true,

                message:
                    "Booking fetched successfully",

                data:
                    booking,
            });

        } catch (error) {
            return res.status(400).json({
                success: false,

                message:
                    "Invalid booking ID",

                error:
                    error.message,
            });
        }
    };
const updateBooking =
    async (req, res) => {
        try {
            const booking =
                await Booking.findByIdAndUpdate(
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

                    message:
                        "Booking not found",
                });
            }


            return res.status(200).json({
                success: true,

                message:
                    "Booking updated successfully",

                data:
                    booking,
            });

        } catch (error) {
            return res.status(400).json({
                success: false,

                message:
                    "Failed to update booking",

                error:
                    error.message,
            });
        }
    };
const deleteBooking =
    async (req, res) => {
        try {
            const booking =
                await Booking.findByIdAndDelete(
                    req.params.id
                );


            if (!booking) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Booking not found",
                });
            }


            return res.status(200).json({
                success: true,

                message:
                    "Booking deleted successfully",

                data:
                    booking,
            });

        } catch (error) {
            return res.status(400).json({
                success: false,

                message:
                    "Failed to delete booking",

                error:
                    error.message,
            });
        }
    };
const getDriverPendingBookings = async (req, res) => {
    try {
        const driverUserId = req.params.userId;

        const driver = await Driver.findOne({
            user: driverUserId,
            isApproved: true,
            verificationStatus: "approved",
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Approved driver profile not found",
            });
        }

        const bookings = await Booking.find({
            status: "pending",
            driver: null,
        })
            .populate(
                "user",
                "name email phone gender"
            )
            .sort({
                bookingDate: 1,
            });

        return res.status(200).json({
            success: true,
            data: bookings,
        });

    } catch (error) {
        console.error(
            "Get driver pending bookings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch pending ride requests",
            error: error.message,
        });
    }

};
const acceptBookingByDriver = async (req, res) => {
    try {
        const {
            bookingId,
            userId,
        } = req.params;

        const driver = await Driver.findOne({
            user: userId,
            isApproved: true,
            verificationStatus: "approved",
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message:
                    "Approved driver profile not found",
            });
        }

        const booking =
            await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message:
                    "Booking not found",
            });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    "This booking is no longer pending",
            });
        }

        if (booking.driver) {
            return res.status(400).json({
                success: false,
                message:
                    "This booking has already been assigned",
            });
        }

        booking.driver = driver._id;
        booking.status = "accepted";

        await booking.save();

        return res.status(200).json({
            success: true,
            message:
                "Ride accepted successfully",
            data: booking,
        });

    } catch (error) {
        console.error(
            "Accept booking error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to accept ride",
            error: error.message,
        });
    }
};
const assignPendingBookingsForDriver = async (driverId) => {
    try {
        const driver = await Driver.findById(driverId)
            .populate(
                "user",
                "name email phone gender isActive"
            );

        if (!driver) {
            return 0;
        }

        // Driver must be approved and active
        if (
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
            .populate(
                "user",
                "name email phone gender isActive"
            )
            .sort({
                bookingDate: 1,
            });

        let assignedCount = 0;

        for (const booking of pendingBookings) {
            if (!booking.user) {
                continue;
            }

            /*
             * Check whether this driver is available
             * on the booking date/time.
             */
            const available = await isDriverAvailable(
                driver._id,
                booking.bookingDate
            );

            if (!available) {
                continue;
            }

            const riderGender =
                booking.user.gender;

            const driverGender =
                driver.user.gender;

            let eligible = false;

            /*
             * Female rider:
             *
             * Female driver -> allowed
             *
             * Male driver -> only allowed if
             * rider already accepted male driver.
             */
            if (riderGender === "female") {
                if (driverGender === "female") {
                    eligible = true;
                } else if (
                    driverGender === "male" &&
                    booking.maleDriverConsent ===
                        "accepted"
                ) {
                    eligible = true;
                }
            }

            /*
             * Normal rider:
             * Keep your existing behavior where
             * male drivers handle normal bookings.
             */
            else {
                if (driverGender === "male") {
                    eligible = true;
                }
            }

            if (!eligible) {
                continue;
            }

            /*
             * Atomic update prevents two drivers from
             * accepting the same pending booking.
             */
            const assigned =
                await Booking.findOneAndUpdate(
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

            if (!assigned) {
                continue;
            }

            assignedCount++;

            /*
             * Notify rider.
             */
            await Notification.create({
                user: booking.user._id,

                title: "Driver Assigned",

                message:
                    `Your ride has been accepted by ${driver.user.name}.`,

                type: "ride",

                relatedRide: null,

                isRead: false,
            });
        }

        return assignedCount;
    } catch (error) {
        console.error(
            "assignPendingBookingsForDriver error:",
            error
        );

        return 0;
    }
};
module.exports = {
    createBooking,
    routePreview,
    updateWomenDriverConsent,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getDriverPendingBookings,
    acceptBookingByDriver,
    assignPendingBookingsForDriver,
};