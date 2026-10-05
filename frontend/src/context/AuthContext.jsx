import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../api/axios";

const AuthContext =
    createContext(null);

export const AuthProvider = ({
    children,
}) => {
    const [user, setUser] =
        useState(() => {
            const saved =
                localStorage.getItem(
                    "user"
                );

            if (!saved) return null;

            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        });

    const [loading, setLoading] =
        useState(false);

    const login = async (
        email,
        password
    ) => {
        setLoading(true);

        try {
            const response =
                await api.post(
                    "/auth/login",
                    {
                        email,
                        password,
                    }
                );

            const data =
                response.data;

            const loggedUser =
                data.user;

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    loggedUser
                )
            );

            setUser(loggedUser);

            return loggedUser;
        } finally {
            setLoading(false);
        }
    };

    const register = async (
        formData
    ) => {
        setLoading(true);

        try {
            const response =
                await api.post(
                    "/auth/register",
                    formData
                );

            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
    // Normal user session
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Admin session
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    setUser(null);
};

    const updateUser = (updated) => {
        setUser(updated);

        localStorage.setItem(
            "user",
            JSON.stringify(updated)
        );
    };

    useEffect(() => {
        const token =
            localStorage.getItem(
                "token"
            );

        if (!token) {
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () =>
    useContext(AuthContext);