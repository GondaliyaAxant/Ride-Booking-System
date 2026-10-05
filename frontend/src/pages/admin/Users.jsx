import AdminResource from "./AdminResource";

const Users = () => (
    <AdminResource
        title="Users"
        endpoint="users"
        fields={[
            "name",
            "email",
            "phone",
            "role",
            "gender",
        ]}
    />
);

export default Users;