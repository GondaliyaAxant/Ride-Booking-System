const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes: verify JWT token and attach user to req.user
 */
const protect = async (req, res, next) => {
    try {
        let token = null;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. No token provided.",
            });
        }

        const secret =
            process.env.JWT_SECRET || "ride_booking_system_secret_2026";
        const decoded = jwt.verify(token, secret);

        // Handle admin token (special payload with role: 'admin')
        if (decoded.role === "admin" && (!decoded.id || decoded.id === "admin")) {
            req.user = {
                _id: "admin",
                id: "admin",
                name: "Administrator",
                email: decoded.email || "admin1@gmail.com",
                role: "admin",
                gender: "other",
                isActive: true,
            };
            return next();
        }

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload.",
            });
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive. Please contact support.",
            });
        }

        req.user = user;
        req.user.id = user._id.toString();
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized. Invalid or expired token.",
            error: error.message,
        });
    }
};

/**
 * Authorize specific roles
 * @param  {...string} roles Allowed roles e.g. 'rider', 'driver', 'admin'
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!roles.includes(req.user.role) && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
            });
        }

        next();
    };
};

const adminOnly = authorize("admin");

module.exports = {
    protect,
    authorize,
    adminOnly,
};
