const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
    adminLogin,
    getAdminProfile,
    getDashboardStats,
} = require("../controllers/adminController");

const router = express.Router();

// Admin login
router.post("/login", adminLogin);

// Admin profile
router.get("/profile", protect, adminOnly, getAdminProfile);

// Admin dashboard statistics
router.get("/dashboard-stats", protect, adminOnly, getDashboardStats);

module.exports = router;