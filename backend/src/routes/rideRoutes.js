const express = require("express");
const router = express.Router();

const {
    createRide,
    getRides,
    getRideById,
    updateRide,
    deleteRide
} = require("../controllers/rideController");

router.post("/", createRide);
router.get("/", getRides);
router.get("/:id", getRideById);
router.put("/:id", updateRide);
router.delete("/:id", deleteRide);

module.exports = router;