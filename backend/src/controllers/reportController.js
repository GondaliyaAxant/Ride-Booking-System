const Report = require("../models/Report");

// Create Report
const createReport = async (req, res) => {
    try {
        const report = new Report(req.body);
        const savedReport = await report.save();

        res.status(201).json({
            success: true,
            message: "Report created successfully",
            data: savedReport
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create report",
            error: error.message
        });
    }
};

// Get All Reports
const getReports = async (req, res) => {
    try {
        const reports = await Report.find();

        res.status(200).json({
            success: true,
            message: "Reports fetched successfully",
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports",
            error: error.message
        });
    }
};

// Get Report By ID
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Report fetched successfully",
            data: report
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid report ID",
            error: error.message
        });
    }
};

// Update Report
const updateReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: report
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update report",
            error: error.message
        });
    }
};

// Delete Report
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Report deleted successfully",
            data: report
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete report",
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    updateReport,
    deleteReport
};