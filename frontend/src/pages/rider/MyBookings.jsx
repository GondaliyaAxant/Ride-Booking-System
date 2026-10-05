import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

const MyBookings = () => {
    const [bookings, setBookings] =
        useState([]);

    const [filter, setFilter] =
        useState("all");

    const [loading, setLoading] =
        useState(true);

    const load = async () => {
        try {
            setLoading(true);

            const response =
                await api.get(
                    "/bookings"
                );

            setBookings(
                response.data.data ||
                    response.data ||
                    []
            );
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered =
        filter === "all"
            ? bookings
            : bookings.filter(
                  (item) =>
                      item.status ===
                      filter
              );

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        My Bookings
                    </h1>

                    <p>
                        View and track
                        your trips.
                    </p>
                </div>

                <Link
                    to="/rider/book"
                    className="btn btn-primary"
                >
                    + Book Ride
                </Link>

            </div>

            <div className="filters">

                {[
                    "all",
                    "pending",
                    "accepted",
                    "ongoing",
                    "completed",
                    "cancelled",
                ].map(
                    (item) => (
                        <button
                            key={item}
                            onClick={() =>
                                setFilter(
                                    item
                                )
                            }
                            className={
                                filter ===
                                item
                                    ? "filter active"
                                    : "filter"
                            }
                        >
                            {item}
                        </button>
                    )
                )}

            </div>

            <div className="content-card">

                {loading ? (
                    <div className="empty-state">
                        Loading bookings...
                    </div>
                ) : filtered.length ===
                  0 ? (
                    <div className="empty-state">
                        <div>
                            📋
                        </div>

                        <h3>
                            No bookings
                        </h3>

                        <p>
                            You don't
                            have any
                            bookings in
                            this category.
                        </p>
                    </div>
                ) : (
                    <div className="booking-list">

                        {filtered
                            .slice()
                            .reverse()
                            .map(
                                (
                                    booking
                                ) => (
                                    <div
                                        className="booking-item"
                                        key={
                                            booking._id
                                        }
                                    >

                                        <div className="route">

                                            <small>
                                                PICKUP
                                            </small>

                                            <strong>
                                                {
                                                    booking.pickupLocation
                                                }
                                            </strong>

                                            <span>
                                                ↓
                                            </span>

                                            <small>
                                                DROP
                                            </small>

                                            <strong>
                                                {
                                                    booking.dropLocation
                                                }
                                            </strong>

                                        </div>

                                        <div className="booking-meta">

                                            <span>
                                                {formatDate(
                                                    booking.bookingDate
                                                )}
                                            </span>

                                            <strong>
                                                ₹
                                                {
                                                    booking.fare
                                                }
                                            </strong>

                                            <span
                                                className={`status status-${booking.status}`}
                                            >
                                                {
                                                    booking.status
                                                }
                                            </span>

                                        </div>

                                    </div>
                                )
                            )}

                    </div>
                )}

            </div>

        </div>
    );
};

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

export default MyBookings;