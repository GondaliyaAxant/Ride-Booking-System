const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    createNotification,
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    updateNotification,
    deleteNotification,
} = require("../controllers/notificationController");

router.post("/", protect, createNotification);
router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.get("/:id", protect, getNotificationById);
router.put("/:id", protect, updateNotification);
router.delete("/:id", protect, deleteNotification);

module.exports = router;