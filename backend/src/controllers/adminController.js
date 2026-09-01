const Admin = require("../models/admin");

// Create Admin
const createAdmin = async (req, res) => {
    try {
        const admin = new Admin(req.body);
        const savedAdmin = await admin.save();

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: savedAdmin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create admin",
            error: error.message
        });
    }
};

// Get All Admins
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();

        res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch admins",
            error: error.message
        });
    }
};

// Get Admin By ID
const getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin fetched successfully",
            data: admin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid admin ID",
            error: error.message
        });
    }
};

// Update Admin
const updateAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: admin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update admin",
            error: error.message
        });
    }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
            data: admin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete admin",
            error: error.message
        });
    }
};

module.exports = {
    createAdmin,
    getAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin
};