const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = "admin1@gmail.com";
const ADMIN_PASSWORD = "Admin1@123";

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Check admin credentials defined in code
        if (
            email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
            password !== ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password",
            });
        }

        // Create admin JWT
        const token = jwt.sign(
            {
                role: "admin",
                email: ADMIN_EMAIL,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                email: ADMIN_EMAIL,
                role: "admin",
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Admin login failed",
        });
    }
};

const getAdminProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
};

module.exports = {
    adminLogin,
    getAdminProfile,
};