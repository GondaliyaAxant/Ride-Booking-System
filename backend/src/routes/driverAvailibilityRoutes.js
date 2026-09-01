const express = require("express");
const router = express.Router();

const {
    createAvailability,
    getAvailability,
    getAvailabilityByDriver,
    updateAvailability,
    deleteAvailability
} = require("../controllers/driverAvailabilityController");

router.post("/", createAvailability);
router.get("/", getAvailability);
router.get("/driver/:driverId", getAvailabilityByDriver);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);

module.exports = router;