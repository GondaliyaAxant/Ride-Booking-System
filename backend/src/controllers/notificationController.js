const Notification = require("../models/Notification");

// Create Notification
const createNotification = async (req, res) => {
    try {
        const notification = new Notification({
            ...req.body,
            user: req.body.user || req.user._id,
        });
        const savedNotification = await notification.save();

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: savedNotification,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to create notification",
            error: error.message,
        });
    }
};

// Get All Notifications for Current User (or all for admin)
const getNotifications = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role !== "admin") {
            query.user = req.user._id;
        }

        const notifications = await Notification.find(query)
            .populate("user", "name email phone role")
            .populate("relatedBooking")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message,
        });
    }
};

// Get Notification By ID
const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate("user", "name email phone role")
            .populate("relatedBooking");

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification fetched successfully",
            data: notification,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID",
            error: error.message,
        });
    }
};

// Mark Single Notification as Read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to update notification",
            error: error.message,
        });
    }
};

// Mark All User Notifications as Read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
            error: error.message,
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
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            data: notification,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to update notification",
            error: error.message,
        });
    }
};

// Delete Notification
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
            data: notification,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message,
        });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    updateNotification,
    deleteNotification,
};