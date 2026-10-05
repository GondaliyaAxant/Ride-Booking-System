const express = require("express");

const {
    adminLogin,
    getAdminProfile,
} = require("../controllers/adminController");

const router = express.Router();

// Admin login
router.post("/login", adminLogin);

// Admin profile
router.get("/profile", getAdminProfile);

module.exports = router;