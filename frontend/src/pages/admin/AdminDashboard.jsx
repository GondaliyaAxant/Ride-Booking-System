import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

const AdminDashboard = () => {
    const [stats, setStats] =
        useState({
            users: 0,
            drivers: 0,
            vehicles: 0,
            bookings: 0,
            payments: 0,
            reports: 0,
        });

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const resources = [
            "users",
            "drivers",
            "vehicles",
            "bookings",
            "payments",
            "reports",
        ];

        const result = {};

        await Promise.all(
            resources.map(
                async (resource) => {
                    try {
                        const response =
                            await api.get(
                                `/${resource}`
                            );

                        result[
                            resource
                        ] =
                            (
                                response
                                    .data
                                    .data ||
                                []
                            ).length;
                    } catch {
                        result[
                            resource
                        ] = 0;
                    }
                }
            )
        );

        setStats(
            (previous) => ({
                ...previous,
                ...result,
            })
        );
    };

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Manage your entire
                        RideBook platform.
                    </p>
                </div>

            </div>

            <div className="stats-grid">

                <Stat
                    icon="👥"
                    title="Users"
                    value={
                        stats.users
                    }
                />

                <Stat
                    icon="🚗"
                    title="Drivers"
                    value={
                        stats.drivers
                    }
                />

                <Stat
                    icon="🚘"
                    title="Vehicles"
                    value={
                        stats.vehicles
                    }
                />

                <Stat
                    icon="📋"
                    title="Bookings"
                    value={
                        stats.bookings
                    }
                />

                <Stat
                    icon="💳"
                    title="Payments"
                    value={
                        stats.payments
                    }
                />

                <Stat
                    icon="⚠️"
                    title="Reports"
                    value={
                        stats.reports
                    }
                />

            </div>

            <div className="quick-grid">

                <AdminLink
                    to="/admin/users"
                    icon="👥"
                    title="Users"
                    text="Manage registered users"
                />

                <AdminLink
                    to="/admin/drivers"
                    icon="🚗"
                    title="Drivers"
                    text="Manage drivers"
                />

                <AdminLink
                    to="/admin/vehicles"
                    icon="🚘"
                    title="Vehicles"
                    text="Manage vehicles"
                />

                <AdminLink
                    to="/admin/bookings"
                    icon="📋"
                    title="Bookings"
                    text="Manage bookings"
                />

                <AdminLink
                    to="/admin/payments"
                    icon="💳"
                    title="Payments"
                    text="Manage payments"
                />

                <AdminLink
                    to="/admin/reports"
                    icon="⚠️"
                    title="Reports"
                    text="Review reports"
                />

            </div>

        </div>
    );
};

const Stat = ({
    icon,
    title,
    value,
}) => (
    <div className="stat-card">

        <div className="stat-icon">
            {icon}
        </div>

        <div>
            <span>
                {title}
            </span>

            <strong>
                {value}
            </strong>
        </div>

    </div>
);

const AdminLink = ({
    to,
    icon,
    title,
    text,
}) => (
    <Link
        to={to}
        className="quick-card"
    >
        <div className="quick-icon">
            {icon}
        </div>

        <strong>
            {title}
        </strong>

        <small>
            {text}
        </small>
    </Link>
);

export default AdminDashboard;