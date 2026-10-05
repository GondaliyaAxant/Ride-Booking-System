import AdminResource from "./AdminResource";

const Bookings = () => (
    <AdminResource
        title="Bookings"
        endpoint="bookings"
        fields={[
            "user",
            "driver",
            "pickupLocation",
            "dropLocation",
            "bookingDate",
            "fare",
            "status",
            "womenSafety",
        ]}
    />
);

export default Bookings;