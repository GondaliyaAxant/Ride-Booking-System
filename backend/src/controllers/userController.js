const User = require("../models/user");

// Create User
const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: savedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create user",
            error: error.message
        });
    }
};

// Get All Users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

// Get User By ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID",
            error: error.message
        });
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};