const Payment = require("../models/Payment");

// Create Payment
const createPayment = async (req, res) => {
    try {
        const payment = new Payment(req.body);
        const savedPayment = await payment.save();

        res.status(201).json({
            success: true,
            message: "Payment created successfully",
            data: savedPayment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create payment",
            error: error.message,
        });
    }
};

// Get All Payments
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            data: payments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

// Get Payment By ID
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment fetched successfully",
            data: payment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid payment ID",
            error: error.message,
        });
    }
};

// Update Payment
const updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            data: payment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update payment",
            error: error.message,
        });
    }
};

// Delete Payment
const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment deleted successfully",
            data: payment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete payment",
            error: error.message,
        });
    }
};

const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

// Process / Complete Demo Payment for a Booking (UPI, Card, Cash)
const processPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { paymentMethod, transactionId } = req.body;

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

        const validMethod = ["cash", "card", "upi"].includes(paymentMethod)
            ? paymentMethod
            : booking.paymentMethod || "upi";

        const generatedTxnId =
            transactionId ||
            `${validMethod.toUpperCase()}-${Date.now().toString().slice(-8)}${Math.floor(
                1000 + Math.random() * 9000
            )}`;

        // Find or create payment record
        let payment = await Payment.findOne({ booking: booking._id });
        if (!payment) {
            payment = new Payment({
                booking: booking._id,
                user: booking.user?._id || req.user?._id,
                amount: booking.fare,
                paymentMethod: validMethod,
                paymentStatus: "completed",
                transactionId: generatedTxnId,
                paidAt: new Date(),
            });
        } else {
            payment.paymentMethod = validMethod;
            payment.paymentStatus = "completed";
            payment.transactionId = generatedTxnId;
            payment.paidAt = new Date();
        }

        await payment.save();

        // Update booking payment status
        booking.paymentStatus = "completed";
        booking.paymentMethod = validMethod;
        await booking.save();

        // Safe notifications
        try {
            if (booking.user?._id) {
                await Notification.create({
                    user: booking.user._id,
                    title: "Payment Received",
                    message: `Payment of ₹${booking.fare} via ${validMethod.toUpperCase()} (Txn: ${generatedTxnId}) was successful.`,
                    type: "payment",
                    relatedBooking: booking._id,
                });
            }
            if (booking.driver) {
                const Driver = require("../models/Driver");
                const driverDoc = await Driver.findById(booking.driver);
                if (driverDoc && driverDoc.user) {
                    await Notification.create({
                        user: driverDoc.user,
                        title: "Ride Payment Completed",
                        message: `Rider completed payment of ₹${booking.fare} via ${validMethod.toUpperCase()}.`,
                        type: "payment",
                        relatedBooking: booking._id,
                    });
                }
            }
        } catch (notifErr) {
            console.warn("Payment notification warning:", notifErr.message);
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate("user", "name email phone gender")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email phone gender" },
            });

        return res.status(200).json({
            success: true,
            message: `Payment of ₹${booking.fare} completed successfully via ${validMethod.toUpperCase()}.`,
            data: {
                payment,
                booking: populatedBooking,
                transactionId: generatedTxnId,
            },
        });
    } catch (error) {
        console.error("Process payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process payment",
            error: error.message,
        });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    processPayment,
};