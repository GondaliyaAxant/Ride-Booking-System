import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const adminToken = localStorage.getItem("adminToken");

    const adminLinks = [
        { path: "/admin", label: "Dashboard", icon: "📊" },
        { path: "/admin/bookings", label: "Bookings", icon: "📋" },
        { path: "/admin/drivers", label: "Drivers", icon: "🚗" },
        { path: "/admin/users", label: "Users", icon: "👥" },
        { path: "/admin/vehicles", label: "Vehicles", icon: "🚘" },
        { path: "/admin/payments", label: "Payments", icon: "💳" },
        { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
        { path: "/admin/reports", label: "Reports", icon: "⚠️" },
    ];

    const driverLinks = [
        { path: "/driver", label: "Dashboard", icon: "📊" },
        { path: "/driver/rides", label: "My Rides", icon: "🚕" },
        { path: "/driver/availability", label: "Availability", icon: "🕐" },
        { path: "/driver/vehicle", label: "Vehicle", icon: "🚘" },
        { path: "/driver/profile", label: "Profile", icon: "👤" },
    ];

    const riderLinks = [
        { path: "/rider", label: "Dashboard", icon: "📊" },
        { path: "/rider/book", label: "Book Ride", icon: "🚕" },
        { path: "/rider/bookings", label: "My Bookings", icon: "📋" },
        { path: "/rider/notifications", label: "Notifications", icon: "🔔" },
        { path: "/rider/profile", label: "Profile", icon: "👤" },
    ];

    let links = [];

    if (user?.role === "admin" || (!user && adminToken)) {
        links = adminLinks;
    } else if (user?.role === "driver") {
        links = driverLinks;
    } else if (user?.role === "rider") {
        links = riderLinks;
    }

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const displayName = user?.name || (adminToken ? "Administrator" : "User");
    const displayRole = user?.role || (adminToken ? "admin" : "rider");

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span style={{ fontSize: "1.5rem" }}>🚕</span>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>RideBook</span>
            </div>

            <div className="sidebar-user">
                <div className="avatar">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <strong>{displayName}</strong>
                    <small style={{ textTransform: "capitalize" }}>{displayRole}</small>
                </div>
            </div>

            <nav className="sidebar-menu">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === `/${displayRole}`}
                        className={({ isActive }) =>
                            isActive ? "sidebar-link active" : "sidebar-link"
                        }
                    >
                        <span>{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <button className="sidebar-logout" onClick={handleLogout}>
                🚪 Logout
            </button>
        </aside>
    );
};

export default Sidebar;