import AdminResource from "./AdminResource";

const Vehicles = () => (
    <AdminResource
        title="Vehicles"
        endpoint="vehicles"
        fields={[
            "driver",
            "vehicleType",
            "brand",
            "model",
            "color",
            "registrationNumber",
            "capacity",
        ]}
    />
);

export default Vehicles;