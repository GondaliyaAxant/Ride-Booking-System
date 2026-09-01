const Review = require("../models/review");

// Create Review
const createReview = async (req, res) => {
    try {
        const review = new Review(req.body);
        const savedReview = await review.save();

        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: savedReview
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create review",
            error: error.message
        });
    }
};

// Get All Reviews
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find();

        res.status(200).json({
            success: true,
            message: "Reviews fetched successfully",
            data: reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: error.message
        });
    }
};

// Get Review By ID
const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Review fetched successfully",
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid review ID",
            error: error.message
        });
    }
};

// Update Review
const updateReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update review",
            error: error.message
        });
    }
};

// Delete Review
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: review
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete review",
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
};