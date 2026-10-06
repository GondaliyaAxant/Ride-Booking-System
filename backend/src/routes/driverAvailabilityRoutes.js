const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    createAvailability,
    getAvailabilities,
    getAvailabilityById,
    getAvailabilityByDriver,
    updateAvailability,
    deleteAvailability,
} = require("../controllers/driverAvailabilityController");

router.post("/", protect, createAvailability);
router.get("/", protect, getAvailabilities);
router.get("/driver/:driverId", protect, getAvailabilityByDriver);
router.get("/:id", protect, getAvailabilityById);
router.put("/:id", protect, updateAvailability);
router.delete("/:id", protect, deleteAvailability);

module.exports = router;