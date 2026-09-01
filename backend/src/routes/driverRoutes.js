const express = require("express");
const router = express.Router();

const {
    createDriver,
    getDrivers,
    getDriverById,
    updateDriver,
    deleteDriver
} = require("../controllers/driverController");

router.post("/", createDriver);
router.get("/", getDrivers);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

module.exports = router;