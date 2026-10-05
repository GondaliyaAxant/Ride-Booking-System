import AdminResource from "./AdminResource";

const Payments = () => (
    <AdminResource
        title="Payments"
        endpoint="payments"
        fields={[
            "ride",
            "user",
            "amount",
            "paymentMethod",
            "paymentStatus",
            "transactionId",
        ]}
    />
);

export default Payments;