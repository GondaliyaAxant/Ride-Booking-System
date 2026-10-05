import AdminResource from "./AdminResource";

const Notifications = () => (
    <AdminResource
        title="Notifications"
        endpoint="notifications"
        fields={[
            "user",
            "title",
            "message",
            "type",
            "isRead",
        ]}
    />
);

export default Notifications;