import { useEffect, useState } from "react";
import api from "../../api/axios";

const RiderNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/notifications");
            setNotifications(res.data.data || []);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch {}
    };

    const markAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
        } catch {}
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                }}
            >
                <div>
                    <h1 style={{ margin: "0 0 4px", fontSize: "1.8rem" }}>
                        Notifications
                    </h1>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        Stay updated on your rides and women safety alerts.
                    </p>
                </div>
                {notifications.some((n) => !n.isRead) && (
                    <button
                        onClick={markAllRead}
                        className="btn"
                        style={{ background: "#f3f4f6", color: "#374151" }}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Loading notifications...
                </div>
            ) : notifications.length === 0 ? (
                <div
                    style={{
                        background: "#ffffff",
                        padding: "40px",
                        borderRadius: "14px",
                        textAlign: "center",
                        border: "1px solid #f3f4f6",
                    }}
                >
                    <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔔</div>
                    <h3 style={{ margin: "0 0 6px" }}>No notifications</h3>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        You're all caught up!
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notifications.map((n) => (
                        <div
                            key={n._id}
                            onClick={() => !n.isRead && markRead(n._id)}
                            style={{
                                background: n.isRead ? "#ffffff" : "#f0fdf4",
                                padding: "16px 20px",
                                borderRadius: "12px",
                                border: n.isRead ? "1px solid #f3f4f6" : "1px solid #bbf7d0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: n.isRead ? "default" : "pointer",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                        >
                            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "1.4rem" }}>
                                    {n.type === "women_safety" ? "🛡️" : "🚕"}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.98rem" }}>
                                        {n.title}
                                    </div>
                                    <div style={{ color: "#4b5563", fontSize: "0.9rem", marginTop: "2px" }}>
                                        {n.message}
                                    </div>
                                    <small style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                                        {new Date(n.createdAt).toLocaleString("en-IN")}
                                    </small>
                                </div>
                            </div>
                            {!n.isRead && (
                                <span
                                    style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        background: "#16a34a",
                                        display: "inline-block",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RiderNotifications;