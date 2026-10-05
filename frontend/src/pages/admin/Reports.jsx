import AdminResource from "./AdminResource";

const Reports = () => (
    <AdminResource
        title="Reports"
        endpoint="reports"
        fields={[
            "user",
            "ride",
            "reportType",
            "subject",
            "description",
            "status",
        ]}
    />
);

export default Reports;