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

const DriverDashboard = () => {
    const { user } =
        useAuth();

    const [rides, setRides] =
        useState([]);

    const [driver, setDriver] =
        useState(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const [
                driversRes,
                ridesRes,
            ] = await Promise.all([
                api.get(
                    "/drivers"
                ),
                api.get(
                    "/rides"
                ),
            ]);

            const drivers =
                driversRes.data.data ||
                [];

            const found =
                drivers.find(
                    (item) =>
                        item.user?._id ===
                            user?._id ||
                        item.user ===
                            user?._id ||
                        item.user?._id ===
                            user?.id ||
                        item.user ===
                            user?.id
                );

            setDriver(found);

            const allRides =
                ridesRes.data.data ||
                [];

            const mine =
                allRides.filter(
                    (ride) =>
                        ride.driver?._id ===
                            found?._id ||
                        ride.driver ===
                            found?._id
                );

            setRides(mine);
        } catch {
            setRides([]);
        }
    };

    const completed =
        rides.filter(
            (ride) =>
                ride.rideStatus ===
                "completed"
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
                        Manage your driver
                        activity.
                    </p>
                </div>

            </div>

            <div className="stats-grid">

                <Stat
                    icon="🚕"
                    title="Total Rides"
                    value={
                        rides.length
                    }
                />

                <Stat
                    icon="✓"
                    title="Completed"
                    value={completed}
                />

                <Stat
                    icon="⭐"
                    title="Rating"
                    value={
                        driver?.rating ||
                        0
                    }
                />

                <Stat
                    icon="₹"
                    title="Total Earnings"
                    value={`₹${rides.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            Number(
                                item.fare ||
                                    0
                            ),
                        0
                    )}`}
                />

            </div>

            <div className="quick-grid">

                <Link
                    to="/driver/rides"
                    className="quick-card"
                >
                    🚕
                    <strong>
                        My Rides
                    </strong>
                    <small>
                        View assigned
                        rides
                    </small>
                </Link>

                <Link
                    to="/driver/availability"
                    className="quick-card"
                >
                    🕐
                    <strong>
                        Availability
                    </strong>
                    <small>
                        Manage your
                        schedule
                    </small>
                </Link>

                <Link
                    to="/driver/vehicle"
                    className="quick-card"
                >
                    🚘
                    <strong>
                        Vehicle
                    </strong>
                    <small>
                        Manage vehicle
                        details
                    </small>
                </Link>

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

export default DriverDashboard;