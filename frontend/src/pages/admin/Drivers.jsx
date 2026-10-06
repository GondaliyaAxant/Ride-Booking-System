import { useEffect, useState } from "react";
import api from "../../api/axios";

const AdminDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const loadDrivers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/drivers");
            setDrivers(res.data.data || []);
        } catch {
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, []);

    const handleApprove = async (driverId) => {
        try {
            setActionLoading(driverId);
            await api.patch(`/drivers/${driverId}/approve`);
            await loadDrivers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to approve driver");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (driverId) => {
        try {
            setActionLoading(driverId);
            await api.patch(`/drivers/${driverId}/reject`);
            await loadDrivers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to reject driver");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ margin: "0 0 6px", fontSize: "1.8rem" }}>Driver Management</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Review driver verification status, license info, and approve/reject driver profiles.
                </p>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>Loading drivers...</div>
                ) : drivers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>No drivers registered.</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Driver Name</th>
                                    <th>Gender</th>
                                    <th>Phone / Email</th>
                                    <th>License Number</th>
                                    <th>Rating & Rides</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.map((d) => (
                                    <tr key={d._id}>
                                        <td>
                                            <strong>{d.user?.name || "Driver"}</strong>
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>
                                            {d.user?.gender === "female" ? "👩 Female" : "👨 Male"}
                                        </td>
                                        <td>
                                            <div>{d.user?.phone || "—"}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{d.user?.email}</div>
                                        </td>
                                        <td>
                                            <strong>{d.licenseNumber}</strong>
                                        </td>
                                        <td>
                                            ⭐ {d.rating || "5.0"} ({d.totalRides || 0} rides)
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    background:
                                                        d.verificationStatus === "approved"
                                                            ? "#dcfce7"
                                                            : d.verificationStatus === "rejected"
                                                            ? "#fee2e2"
                                                            : "#fef3c7",
                                                    color:
                                                        d.verificationStatus === "approved"
                                                            ? "#166534"
                                                            : d.verificationStatus === "rejected"
                                                            ? "#991b1b"
                                                            : "#92400e",
                                                }}
                                            >
                                                {d.verificationStatus?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {d.verificationStatus !== "approved" && (
                                                    <button
                                                        onClick={() => handleApprove(d._id)}
                                                        disabled={actionLoading === d._id}
                                                        className="btn btn-small btn-primary"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {d.verificationStatus !== "rejected" && (
                                                    <button
                                                        onClick={() => handleReject(d._id)}
                                                        disabled={actionLoading === d._id}
                                                        className="btn btn-small"
                                                        style={{ background: "#fee2e2", color: "#991b1b" }}
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDrivers;