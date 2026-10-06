const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
    createDriver,
    getDrivers,
    getMyDriverProfile,
    getDriverById,
    updateDriver,
    toggleOnlineStatus,
    approveDriver,
    rejectDriver,
    deleteDriver,
} = require("../controllers/driverController");

router.post("/", protect, createDriver);
router.get("/", getDrivers);
router.get("/me", protect, getMyDriverProfile);
router.patch("/status", protect, toggleOnlineStatus);
router.patch("/:id/approve", protect, authorize("admin"), approveDriver);
router.patch("/:id/reject", protect, authorize("admin"), rejectDriver);
router.get("/:id", getDriverById);
router.put("/:id", protect, updateDriver);
router.delete("/:id", protect, authorize("admin"), deleteDriver);

module.exports = router;