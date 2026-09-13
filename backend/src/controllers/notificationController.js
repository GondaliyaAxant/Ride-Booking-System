const Notification = require("../models/Notification");

// Create Notification
const createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        const savedNotification = await notification.save();

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: savedNotification
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create notification",
            error: error.message
        });
    }
};

// Get All Notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find();

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

// Get Notification By ID
const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification fetched successfully",
            data: notification
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid notification ID",
            error: error.message
        });
    }
};

// Update Notification
const updateNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            data: notification
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update notification",
            error: error.message
        });
    }
};

// Delete Notification
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(
            req.params.id
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
            data: notification
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
};