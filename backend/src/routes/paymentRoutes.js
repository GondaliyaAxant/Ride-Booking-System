const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    processPayment,
} = require("../controllers/paymentController");

router.post("/booking/:bookingId/pay", protect, processPayment);
router.post("/process-demo", protect, processPayment);
router.post("/", protect, createPayment);
router.get("/", protect, getPayments);
router.get("/:id", protect, getPaymentById);
router.put("/:id", protect, updatePayment);
router.delete("/:id", protect, deletePayment);

module.exports = router;