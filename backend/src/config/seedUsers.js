const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        const salt = await bcrypt.genSalt(10);
        const adminPasswordHash = await bcrypt.hash("Admin1@123", salt);
        const standardPasswordHash = await bcrypt.hash("password123", salt);

        // 1. Seed Admin
        let admin = await User.findOne({ email: "admin1@gmail.com" });
        if (admin) {
            admin.password = adminPasswordHash;
            admin.role = "admin";
            admin.isActive = true;
            await admin.save();
            console.log("Admin verified (admin1@gmail.com / Admin1@123)");
        } else {
            admin = await User.create({
                name: "System Admin",
                email: "admin1@gmail.com",
                phone: "9999999999",
                password: adminPasswordHash,
                role: "admin",
                gender: "other",
                isActive: true,
            });
            console.log("Admin created (admin1@gmail.com / Admin1@123)");
        }

        // 2. Test Rider 3 (Female)
        let rider3 = await User.findOne({ email: "rider3@gmail.com" });
        if (rider3) {
            rider3.password = standardPasswordHash;
            rider3.gender = "female";
            rider3.role = "rider";
            rider3.isActive = true;
            await rider3.save();
            console.log("rider3 verified (rider3@gmail.com / password123) [Female]");
        } else {
            rider3 = await User.create({
                name: "Rider Three",
                email: "rider3@gmail.com",
                phone: "9876543213",
                password: standardPasswordHash,
                role: "rider",
                gender: "female",
                isActive: true,
            });
            console.log("rider3 created (rider3@gmail.com / password123) [Female]");
        }

        // 3. Test Rider 2 (Male)
        let rider2 = await User.findOne({ email: "rider2@gmail.com" });
        if (rider2) {
            rider2.password = standardPasswordHash;
            rider2.gender = "male";
            rider2.role = "rider";
            rider2.isActive = true;
            await rider2.save();
            console.log("rider2 verified (rider2@gmail.com / password123) [Male]");
        } else {
            rider2 = await User.create({
                name: "Rider Two",
                email: "rider2@gmail.com",
                phone: "9876543212",
                password: standardPasswordHash,
                role: "rider",
                gender: "male",
                isActive: true,
            });
            console.log("rider2 created (rider2@gmail.com / password123) [Male]");
        }

        // 4. Test Driver 3 (Male, Car)
        let driver3User = await User.findOne({ email: "driver3@gmail.com" });
        if (!driver3User) {
            driver3User = await User.create({
                name: "Driver Three",
                email: "driver3@gmail.com",
                phone: "9123456783",
                password: standardPasswordHash,
                role: "driver",
                gender: "male",
                isActive: true,
            });
        } else {
            driver3User.password = standardPasswordHash;
            driver3User.role = "driver";
            driver3User.gender = "male";
            driver3User.isActive = true;
            await driver3User.save();
        }

        let driver3Profile = await Driver.findOne({ user: driver3User._id });
        if (!driver3Profile) {
            driver3Profile = await Driver.create({
                user: driver3User._id,
                licenseNumber: "DL-GJ-2026-03",
                licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5),
                verificationStatus: "approved",
                isApproved: true,
                isOnline: true,
                rating: 4.9,
                totalRides: 12,
            });
        } else {
            driver3Profile.isApproved = true;
            driver3Profile.verificationStatus = "approved";
            driver3Profile.isOnline = true;
            await driver3Profile.save();
        }

        let vehicle3 = await Vehicle.findOne({ driver: driver3Profile._id });
        if (!vehicle3) {
            await Vehicle.create({
                driver: driver3Profile._id,
                vehicleType: "car",
                brand: "Hyundai",
                model: "i20",
                color: "Silver",
                registrationNumber: "GJ01AB1234",
                capacity: 4,
                isActive: true,
            });
        }
        console.log("driver3 verified (driver3@gmail.com / password123) [Male, Car]");

        // 5. Test Driver 4 (Female, Car - Women Safety)
        let driver4User = await User.findOne({ email: "driver4@gmail.com" });
        if (!driver4User) {
            driver4User = await User.create({
                name: "Driver Four",
                email: "driver4@gmail.com",
                phone: "9123456784",
                password: standardPasswordHash,
                role: "driver",
                gender: "female",
                isActive: true,
            });
        } else {
            driver4User.password = standardPasswordHash;
            driver4User.role = "driver";
            driver4User.gender = "female";
            driver4User.isActive = true;
            await driver4User.save();
        }

        let driver4Profile = await Driver.findOne({ user: driver4User._id });
        if (!driver4Profile) {
            driver4Profile = await Driver.create({
                user: driver4User._id,
                licenseNumber: "DL-GJ-2026-04",
                licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5),
                verificationStatus: "approved",
                isApproved: true,
                isOnline: true,
                rating: 5.0,
                totalRides: 8,
            });
        } else {
            driver4Profile.isApproved = true;
            driver4Profile.verificationStatus = "approved";
            driver4Profile.isOnline = true;
            await driver4Profile.save();
        }

        let vehicle4 = await Vehicle.findOne({ driver: driver4Profile._id });
        if (!vehicle4) {
            await Vehicle.create({
                driver: driver4Profile._id,
                vehicleType: "car",
                brand: "Honda",
                model: "City",
                color: "White",
                registrationNumber: "GJ01FD2026",
                capacity: 4,
                isActive: true,
            });
        }
        console.log("driver4 verified (driver4@gmail.com / password123) [Female, Car]");

        console.log("All test users and seed data initialized successfully!");
    } catch (err) {
        console.error("Seed error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    seed();
}

module.exports = seed;
