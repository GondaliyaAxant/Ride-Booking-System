import {
    Navigate,
} from "react-router-dom";

import {
    useAuth,
} from "../context/AuthContext";

const Dashboard = () => {
    const { user } =
        useAuth();

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return (
        <Navigate
            to={`/${user.role}`}
            replace
        />
    );
};

export default Dashboard;