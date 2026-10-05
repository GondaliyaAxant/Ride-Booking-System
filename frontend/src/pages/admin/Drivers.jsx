import AdminResource from "./AdminResource";

const Drivers = () => (
    <AdminResource
        title="Drivers"
        endpoint="drivers"
        fields={[
            "user",
            "licenseNumber",
            "licenseExpiry",
            "verificationStatus",
            "isApproved",
        ]}
    />
);

export default Drivers;