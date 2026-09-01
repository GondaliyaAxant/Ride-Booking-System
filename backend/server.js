const express = require("express");
const connectDB = require("./src/config/db");

const app = express();

connectDB();

app.use(express.json());

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/drivers", require("./src/routes/driverRoutes"));
app.use("/api/vehicles", require("./src/routes/vehicleRoutes"));
app.use("/api/rides", require("./src/routes/rideRoutes"));
app.use("/api/bookings", require("./src/routes/bookingRoutes"));
app.use(
    "/api/driver-availability",
    require("./src/routes/driverAvailabilityRoutes")
);
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/ratings", require("./src/routes/ratingRoutes"));
app.use("/api/reviews", require("./src/routes/reviewRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));

app.get("/", (req, res) => {
    res.json({
        message: "Ride Booking System API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});