import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

import {
    useAuth,
} from "../../context/AuthContext";

const RiderDashboard = () => {
    const { user } =
        useAuth();

    const [bookings, setBookings] =
        useState([]);

    const load = async () => {
        try {
            const response =
                await api.get(
                    "/bookings"
                );

            const data =
                response.data.data ||
                response.data ||
                [];

            const mine =
                data.filter(
                    (item) =>
                        item.user?._id ===
                            user._id ||
                        item.user ===
                            user._id ||
                        item.user?._id ===
                            user.id ||
                        item.user ===
                            user.id
                );

            setBookings(mine);
        } catch {
            setBookings([]);
        }
    };

    useEffect(() => {
        if (user) load();
    }, [user]);

    const completed =
        bookings.filter(
            (x) =>
                x.status ===
                "completed"
        ).length;

    const pending =
        bookings.filter(
            (x) =>
                x.status ===
                "pending"
        ).length;

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Welcome,{" "}
                        {
                            user?.name?.split(
                                " "
                            )[0]
                        } 👋
                    </h1>

                    <p>
                        Manage your rides
                        and bookings.
                    </p>
                </div>

                <Link
                    to="/rider/book"
                    className="btn btn-primary"
                >
                    + Book Ride
                </Link>

            </div>

            <div className="stats-grid">

                <Stat
                    icon="📋"
                    title="Total Bookings"
                    value={
                        bookings.length
                    }
                />

                <Stat
                    icon="✓"
                    title="Completed"
                    value={completed}
                />

                <Stat
                    icon="🕐"
                    title="Pending"
                    value={pending}
                />

                <Stat
                    icon="⭐"
                    title="Account"
                    value="Active"
                />

            </div>

            <div className="content-card">

                <div className="card-title-row">

                    <h2>
                        Recent Bookings
                    </h2>

                    <Link to="/rider/bookings">
                        View All →
                    </Link>

                </div>

                {bookings.length ===
                0 ? (
                    <div className="empty-state">
                        <div>
                            🚕
                        </div>

                        <h3>
                            No bookings yet
                        </h3>

                        <p>
                            Book your first
                            ride to get
                            started.
                        </p>

                        <Link
                            to="/rider/book"
                            className="btn btn-primary"
                        >
                            Book Ride
                        </Link>
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table>

                            <thead>
                                <tr>
                                    <th>
                                        Pickup
                                    </th>

                                    <th>
                                        Destination
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Fare
                                    </th>

                                    <th>
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {bookings
                                    .slice(
                                        -5
                                    )
                                    .reverse()
                                    .map(
                                        (
                                            booking
                                        ) => (
                                            <tr
                                                key={
                                                    booking._id
                                                }
                                            >
                                                <td>
                                                    {
                                                        booking.pickupLocation
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        booking.dropLocation
                                                    }
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        booking.bookingDate
                                                    )}
                                                </td>

                                                <td>
                                                    ₹
                                                    {
                                                        booking.fare
                                                    }
                                                </td>

                                                <td>
                                                    <Status
                                                        value={
                                                            booking.status
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    )}

                            </tbody>

                        </table>

                    </div>
                )}

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

const Status = ({
    value,
}) => (
    <span
        className={`status status-${value}`}
    >
        {value}
    </span>
);

const formatDate = (
    value
) => {
    if (!value) return "—";

    return new Date(
        value
    ).toLocaleString(
        "en-IN"
    );
};

export default RiderDashboard;