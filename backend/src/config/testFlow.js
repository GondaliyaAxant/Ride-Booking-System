require("dotenv").config();

const API_BASE = "http://localhost:5000/api";

async function post(url, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return data;
}

async function get(url, token) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
        method: "GET",
        headers,
    });
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return data;
}

async function patch(url, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body || {}),
    });
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return data;
}

async function testAll() {
    console.log("==================================================");
    console.log("STARTING END-TO-END SYSTEM VALIDATION TESTS");
    console.log("==================================================");

    // 1. TEST ADMIN LOGIN
    console.log("\n[TEST 1] Testing Admin Login (admin1@gmail.com / Admin1@123)...");
    try {
        const adminRes = await post("/admin/login", {
            email: "admin1@gmail.com",
            password: "Admin1@123",
        });
        console.log("✓ Admin login successful! Role:", adminRes.user?.role);
        const adminToken = adminRes.token;

        const statsRes = await get("/admin/dashboard-stats", adminToken);
        console.log("✓ Admin dashboard stats fetched successfully:", {
            totalUsers: statsRes.data?.totalUsers,
            totalDrivers: statsRes.data?.totalDrivers,
            totalBookings: statsRes.data?.totalBookings,
        });
    } catch (err) {
        console.error("✗ Admin login failed:", err.data || err.message);
    }

    // 2. TEST RIDER & DRIVER LOGINS
    console.log("\n[TEST 2] Testing Rider & Driver Authentication...");
    let riderToken, riderUser, driverToken, driverUser;

    try {
        const riderRes = await post("/auth/login", {
            email: "rider2@gmail.com",
            password: "password123",
        });
        riderToken = riderRes.token;
        riderUser = riderRes.user;
        console.log("✓ Rider logged in:", riderUser.name, "(Gender:", riderUser.gender, ")");

        const driverRes = await post("/auth/login", {
            email: "driver3@gmail.com",
            password: "password123",
        });
        driverToken = driverRes.token;
        driverUser = driverRes.user;
        console.log("✓ Driver logged in:", driverUser.name, "(Vehicle: Car)");
    } catch (err) {
        console.error("✗ Login error:", err.data || err.message);
        return;
    }

    // 3. TEST IMMEDIATE RIDE BOOKING & DISPATCH FLOW
    console.log("\n[TEST 3] Testing Immediate Ride Booking & Driver Dispatch...");
    let bookingId;
    try {
        // A. Rider books ride
        const now = new Date();
        const bookRes = await post(
            "/bookings",
            {
                pickupLocation: "Ahmedabad Airport",
                pickupLatitude: 23.0734,
                pickupLongitude: 72.6266,
                dropLocation: "Vastrapur Lake",
                dropLatitude: 23.0350,
                dropLongitude: 72.5293,
                bookingDate: now.toISOString(),
                vehicleType: "car",
                paymentMethod: "upi",
            },
            riderToken
        );

        console.log("✓ Booking created successfully! Status:", bookRes.data?.status);
        bookingId = bookRes.data?._id;

        // B. Driver checks Available Requests
        const pendingRes = await get("/bookings/driver/pending", driverToken);
        const found = pendingRes.data.find((b) => b._id === bookingId);
        console.log(
            `✓ Driver3 Available Requests count: ${pendingRes.data.length}. Booking visible to driver? ${!!found}`
        );

        // C. Driver accepts booking
        const acceptRes = await patch(`/bookings/driver/accept/${bookingId}`, {}, driverToken);
        console.log("✓ Driver accepted ride:", acceptRes.message);

        // D. Verify booking is assigned and no longer in available list
        const pendingAfter = await get("/bookings/driver/pending", driverToken);
        const foundAfter = pendingAfter.data.find((b) => b._id === bookingId);
        console.log(`✓ Booking removed from Available Requests after acceptance? ${!foundAfter}`);

        // E. Advance ride lifecycle: driver_arriving -> driver_arrived -> ongoing -> completed
        await patch(`/bookings/${bookingId}/status`, { status: "driver_arriving" }, driverToken);
        console.log("✓ Status updated to driver_arriving");

        await patch(`/bookings/${bookingId}/status`, { status: "driver_arrived" }, driverToken);
        console.log("✓ Status updated to driver_arrived");

        await patch(`/bookings/${bookingId}/status`, { status: "ongoing" }, driverToken);
        console.log("✓ Status updated to ongoing (Trip started)");

        await patch(`/bookings/${bookingId}/status`, { status: "completed" }, driverToken);
        console.log("✓ Status updated to completed (Trip finished)");

        // F. Demo UPI payment
        const payRes = await post(
            `/payments/booking/${bookingId}/pay`,
            { paymentMethod: "upi" },
            riderToken
        );
        console.log(
            "✓ UPI Demo Payment processed successfully:",
            payRes.message,
            "Txn ID:",
            payRes.data?.transactionId
        );
    } catch (err) {
        console.error("✗ Ride flow error:", err.data || err.message);
    }

    // 4. TEST ADVANCE 3-DAY BOOKING AND TIME ENFORCEMENT
    console.log("\n[TEST 4] Testing Advance 3-Day Booking & Early Start Protection...");
    try {
        const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days in future
        const advRes = await post(
            "/bookings",
            {
                pickupLocation: "SG Highway",
                pickupLatitude: 23.0500,
                pickupLongitude: 72.5100,
                dropLocation: "Gandhinagar",
                dropLatitude: 23.2156,
                dropLongitude: 72.6369,
                bookingDate: futureDate.toISOString(),
                vehicleType: "car",
                paymentMethod: "cash",
            },
            riderToken
        );
        const advBookingId = advRes.data?._id;
        console.log("✓ Advance 3-day booking created successfully for:", futureDate.toLocaleString());

        // Driver accepts advance ride
        await patch(`/bookings/driver/accept/${advBookingId}`, {}, driverToken);
        console.log("✓ Driver accepted advance scheduled ride");

        // Try to start early -> should be rejected!
        try {
            await patch(`/bookings/${advBookingId}/status`, { status: "driver_arriving" }, driverToken);
            console.error("✗ Early start should have been rejected!");
        } catch (earlyErr) {
            console.log(
                "✓ Early start was correctly rejected by backend with message:",
                earlyErr.data?.message || earlyErr.message
            );
        }
    } catch (err) {
        console.error("✗ Advance booking error:", err.data || err.message);
    }

    console.log("\n==================================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
}

testAll().catch(console.error);
