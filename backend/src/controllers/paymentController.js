const Payment = require("../models/payment");

// Create Payment
const createPayment = async (req, res) => {
    try {
        const payment = new Payment(req.body);
        const savedPayment = await payment.save();

        res.status(201).json({
            success: true,
            message: "Payment created successfully",
            data: savedPayment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create payment",
            error: error.message
        });
    }
};

// Get All Payments
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find();

        res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: error.message
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
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment fetched successfully",
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid payment ID",
            error: error.message
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
                runValidators: true
            }
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update payment",
            error: error.message
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
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment deleted successfully",
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete payment",
            error: error.message
        });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment
};