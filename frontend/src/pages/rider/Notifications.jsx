import {
    useEffect,
    useState,
} from "react";

import api from "../../api/axios";

const Notifications = () => {
    const [items, setItems] =
        useState([]);

    const load = async () => {
        try {
            const response =
                await api.get(
                    "/notifications"
                );

            setItems(
                response.data.data ||
                    response.data ||
                    []
            );
        } catch {
            setItems([]);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div>

            <div className="page-header">

                <div>
                    <h1>
                        Notifications
                    </h1>

                    <p>
                        Your latest
                        RideBook updates.
                    </p>
                </div>

            </div>

            <div className="notification-list">

                {items.length === 0 ? (
                    <div className="content-card empty-state">
                        <div>
                            🔔
                        </div>

                        <h3>
                            No notifications
                        </h3>

                        <p>
                            You're all
                            caught up.
                        </p>
                    </div>
                ) : (
                    items
                        .slice()
                        .reverse()
                        .map(
                            (item) => (
                                <div
                                    className="notification-item"
                                    key={
                                        item._id
                                    }
                                >

                                    <div className="notification-icon">
                                        🔔
                                    </div>

                                    <div>
                                        <strong>
                                            {
                                                item.title
                                            }
                                        </strong>

                                        <p>
                                            {
                                                item.message
                                            }
                                        </p>

                                        <small>
                                            {formatDate(
                                                item.createdAt
                                            )}
                                        </small>
                                    </div>

                                </div>
                            )
                        )
                )}

            </div>

        </div>
    );
};

const formatDate = (
    value
) => {
    if (!value) return "";

    return new Date(
        value
    ).toLocaleString(
        "en-IN"
    );
};

export default Notifications;