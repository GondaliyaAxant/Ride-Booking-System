import {
    Navigate,
    Outlet,
    Route,
    Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// =====================
// Rider
// =====================

import RiderDashboard from "./pages/rider/RiderDashboard";
import BookRide from "./pages/rider/BookRide";
import MyBookings from "./pages/rider/MyBookings";
import BookingDetails from "./pages/rider/BookingDetails";
import RiderNotifications from "./pages/rider/Notifications";
import RiderProfile from "./pages/rider/Profile";

// =====================
// Driver
// =====================

import DriverDashboard from "./pages/driver/DriverDashboard";
import MyRides from "./pages/driver/MyRides";
import Availability from "./pages/driver/Availability";
import DriverVehicle from "./pages/driver/Vehicle";
import DriverProfile from "./pages/driver/Profile";

// =====================
// Admin
// =====================

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Drivers from "./pages/admin/Drivers";
import Vehicles from "./pages/admin/Vehicles";
import Bookings from "./pages/admin/Bookings";
import Payments from "./pages/admin/Payments";
import AdminNotifications from "./pages/admin/Notifications";
import Reports from "./pages/admin/Reports";


// =====================================================
// ADMIN ROUTE
// =====================================================

const AdminRoute = () => {
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );
    }

    return <Outlet />;
};


// =====================================================
// APP LAYOUT
// =====================================================

const AppLayout = () => {
    return (
        <div className="app-layout">

            <Sidebar />

            <main className="main-content">

                <Routes>

                    {/* =================================================
                        ADMIN
                    ================================================= */}

                    <Route element={<AdminRoute />}>

                        <Route
                            path="/admin"
                            element={<AdminDashboard />}
                        />

                        <Route
                            path="/admin/users"
                            element={<Users />}
                        />

                        <Route
                            path="/admin/drivers"
                            element={<Drivers />}
                        />

                        <Route
                            path="/admin/vehicles"
                            element={<Vehicles />}
                        />

                        <Route
                            path="/admin/bookings"
                            element={<Bookings />}
                        />

                        <Route
                            path="/admin/payments"
                            element={<Payments />}
                        />

                        <Route
                            path="/admin/notifications"
                            element={<AdminNotifications />}
                        />

                        <Route
                            path="/admin/reports"
                            element={<Reports />}
                        />

                    </Route>


                    {/* =================================================
                        DRIVER
                    ================================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={["driver"]}
                            />
                        }
                    >

                        <Route
                            path="/driver"
                            element={<DriverDashboard />}
                        />

                        <Route
                            path="/driver/rides"
                            element={<MyRides />}
                        />

                        <Route
                            path="/driver/availability"
                            element={<Availability />}
                        />

                        <Route
                            path="/driver/vehicle"
                            element={<DriverVehicle />}
                        />

                        <Route
                            path="/driver/profile"
                            element={<DriverProfile />}
                        />

                    </Route>


                    {/* =================================================
                        RIDER
                    ================================================= */}

                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={["rider"]}
                            />
                        }
                    >

                        <Route
                            path="/rider"
                            element={<RiderDashboard />}
                        />

                        <Route
                            path="/rider/book"
                            element={<BookRide />}
                        />

                        <Route
                            path="/rider/bookings"
                            element={<MyBookings />}
                        />

                        <Route
                            path="/rider/bookings/:id"
                            element={<BookingDetails />}
                        />

                        <Route
                            path="/rider/notifications"
                            element={<RiderNotifications />}
                        />

                        <Route
                            path="/rider/profile"
                            element={<RiderProfile />}
                        />

                    </Route>

                </Routes>

            </main>

        </div>
    );
};


// =====================================================
// MAIN APP
// =====================================================

const App = () => {

    const { user } = useAuth();

    const adminToken =
        localStorage.getItem("adminToken");

    return (
        <Routes>

            {/* =================================================
                HOME
            ================================================= */}

            <Route
                path="/"
                element={
                    user ? (
                        <Navigate
                            to={`/${user.role}`}
                            replace
                        />
                    ) : adminToken ? (
                        <Navigate
                            to="/admin"
                            replace
                        />
                    ) : (
                        <Home />
                    )
                }
            />


            {/* =================================================
                NORMAL LOGIN
            ================================================= */}

            <Route
                path="/login"
                element={
                    user ? (
                        <Navigate
                            to={`/${user.role}`}
                            replace
                        />
                    ) : adminToken ? (
                        <Navigate
                            to="/admin"
                            replace
                        />
                    ) : (
                        <Login />
                    )
                }
            />


            {/* =================================================
                ADMIN LOGIN
            ================================================= */}

            <Route
                path="/admin/login"
                element={
                    adminToken ? (
                        <Navigate
                            to="/admin"
                            replace
                        />
                    ) : (
                        <AdminLogin />
                    )
                }
            />


            {/* =================================================
                REGISTER
            ================================================= */}

            <Route
                path="/register"
                element={
                    user ? (
                        <Navigate
                            to={`/${user.role}`}
                            replace
                        />
                    ) : adminToken ? (
                        <Navigate
                            to="/admin"
                            replace
                        />
                    ) : (
                        <Register />
                    )
                }
            />


            {/* =================================================
                GENERAL DASHBOARD
            ================================================= */}

            <Route
                path="/dashboard"
                element={
                    user ? (
                        <Dashboard />
                    ) : adminToken ? (
                        <Navigate
                            to="/admin"
                            replace
                        />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />


            {/* =================================================
                APPLICATION ROUTES
            ================================================= */}

            <Route
                path="/*"
                element={
                    user || adminToken ? (
                        <AppLayout />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />

        </Routes>
    );
};

export default App;