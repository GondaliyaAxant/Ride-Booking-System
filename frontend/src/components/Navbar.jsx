import {
    Link,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const {
        user,
        logout,
    } = useAuth();

    const navigate =
        useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="navbar">

            <Link
                to="/"
                className="brand"
            >
                🚕 RideBook
            </Link>

            <div className="navbar-right">

                {user ? (
                    <>
                        <span className="user-name">
                            {user.name}
                        </span>

                        <button
                            className="btn btn-dark"
                            onClick={
                                handleLogout
                            }
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="nav-login"
                        >
                            Login
                        </Link>

                        <Link
                            to="/register"
                            className="btn btn-dark"
                        >
                            Register
                        </Link>
                    </>
                )}

            </div>
        </header>
    );
};

export default Navbar;