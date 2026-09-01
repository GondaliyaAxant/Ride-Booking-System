const express = require("express");
const router = express.Router();

const {
    createRating,
    getRatings,
    getRatingById,
    updateRating,
    deleteRating
} = require("../controllers/ratingController");

router.post("/", createRating);
router.get("/", getRatings);
router.get("/:id", getRatingById);
router.put("/:id", updateRating);
router.delete("/:id", deleteRating);

module.exports = router;