import {
    useEffect,
    useState,
} from "react";

import api from "../../api/axios";

const MyRides = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    const storedUser =
        localStorage.getItem("user");

    const user = storedUser
        ? JSON.parse(storedUser)
        : null;

    const userId =
        user?._id || user?.id;

    const load = async () => {
        try {
            setLoading(true);

            if (!userId) {
                setRides([]);
                return;
            }

            const response =
                await api.get(
                    `/bookings/driver/${userId}/pending`
                );

            setRides(
                response.data.data || []
            );

        } catch (err) {
            console.error(
                "Failed to load ride requests:",
                err
            );

            setRides([]);

        } finally {
            setLoading(false);
        }
    };

   useEffect(() => {
    load();

    const interval = setInterval(() => {
        load();
    }, 5000);

    return () => clearInterval(interval);
}, [userId]);
    const acceptRide = async (
        bookingId
    ) => {
        try {
            await api.patch(
                `/bookings/driver/${userId}/${bookingId}/accept`
            );

            alert(
                "Ride accepted successfully."
            );

            load();

        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to accept ride."
            );
        }
    };

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Ride Requests
                    </h1>

                    <p>
                        View and accept
                        available rider requests.
                    </p>
                </div>

            </div>

            <div className="content-card">

                {loading ? (
                    <p>
                        Loading ride requests...
                    </p>
                ) : rides.length === 0 ? (
                    <p>
                        No pending ride requests.
                    </p>
                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>
                                <tr>

                                    <th>
                                        Rider
                                    </th>

                                    <th>
                                        Pickup
                                    </th>

                                    <th>
                                        Drop
                                    </th>

                                    <th>
                                        Date & Time
                                    </th>

                                    <th>
                                        Fare
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {rides.map(
                                    (ride) => (
                                        <tr
                                            key={
                                                ride._id
                                            }
                                        >

                                            <td>
                                                {
                                                    ride.user?.name ||
                                                    "Rider"
                                                }
                                            </td>

                                            <td>
                                                {getAddress(
                                                    ride.pickupLocation
                                                )}
                                            </td>

                                            <td>
                                                {getAddress(
                                                    ride.dropLocation
                                                )}
                                            </td>

                                            <td>
                                                {ride.bookingDate
                                                    ? new Date(
                                                        ride.bookingDate
                                                    ).toLocaleString()
                                                    : "—"}
                                            </td>

                                            <td>
                                                ₹
                                                {
                                                    ride.fare
                                                }
                                            </td>

                                            <td>

                                                <button
                                                    className="btn btn-small btn-primary"
                                                    onClick={() =>
                                                        acceptRide(
                                                            ride._id
                                                        )
                                                    }
                                                >
                                                    Accept Ride
                                                </button>

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

const getAddress = (
    value
) => {
    if (!value) {
        return "—";
    }

    if (
        typeof value ===
        "string"
    ) {
        return value;
    }

    return (
        value.address ||
        value.name ||
        "—"
    );
};

export default MyRides;