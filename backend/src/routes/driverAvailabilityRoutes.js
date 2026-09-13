const express = require("express");
const router = express.Router();

const {
    createAvailability,
    getAvailabilities,
    getAvailabilityById,
    getAvailabilityByDriver,
    updateAvailability,
    deleteAvailability
} = require("../controllers/driverAvailabilityController");

router.post("/", createAvailability);
router.get("/", getAvailabilities);
router.get("/driver/:driverId", getAvailabilityByDriver);
router.get("/:id", getAvailabilityById);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

module.exports = router;