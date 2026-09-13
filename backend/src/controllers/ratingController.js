const Rating = require("../models/Rating");

// Create Rating
const createRating = async (req, res) => {
    try {
        const rating = new Rating(req.body);
        const savedRating = await rating.save();

        res.status(201).json({
            success: true,
            message: "Rating created successfully",
            data: savedRating
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create rating",
            error: error.message
        });
    }
};

// Get All Ratings
const getRatings = async (req, res) => {
    try {
        const ratings = await Rating.find();

        res.status(200).json({
            success: true,
            message: "Ratings fetched successfully",
            data: ratings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch ratings",
            error: error.message
        });
    }
};

// Get Rating By ID
const getRatingById = async (req, res) => {
    try {
        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating fetched successfully",
            data: rating
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid rating ID",
            error: error.message
        });
    }
};

// Update Rating
const updateRating = async (req, res) => {
    try {
        const rating = await Rating.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating updated successfully",
            data: rating
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update rating",
            error: error.message
        });
    }
};

// Delete Rating
const deleteRating = async (req, res) => {
    try {
        const rating = await Rating.findByIdAndDelete(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating deleted successfully",
            data: rating
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete rating",
            error: error.message
        });
    }
};

module.exports = {
    createRating,
    getRatings,
    getRatingById,
    updateRating,
    deleteRating
};