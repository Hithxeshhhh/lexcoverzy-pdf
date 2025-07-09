import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Dynamic URL selection based on environment
    const getApiUrl = () => {
        if (import.meta.env.VITE_ENV === 'prod') return import.meta.env.VITE_API_BASE_URL_PROD;
        else if (import.meta.env.VITE_ENV === 'dev') return import.meta.env.VITE_BACKEND_DEV;
        else return import.meta.env.VITE_API_BASE_URL_LOCAL;
    };

    // Check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await fetch(`${getApiUrl()}/api/auth/verify-token`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setUser(result.data.user);
                    } else {
                        // Token is invalid, remove it
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    // Login function
    const login = async (username, password) => {
        try {
            const response = await fetch(`${getApiUrl()}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                const { token: newToken, user: userData } = result.data;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                setUser(userData);
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Get current user info
    const getCurrentUser = async () => {
        if (!token) return null;

        try {
            const response = await fetch(`${getApiUrl()}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setUser(result.data.user);
                return result.data.user;
            }
        } catch (error) {
            console.error('Get current user error:', error);
        }
        return null;
    };

    // API call helper with authentication
    const authenticatedFetch = async (url, options = {}) => {
        if (!token) {
            throw new Error('No authentication token available');
        }

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Merge headers, but don't override Content-Type for FormData
        const headers = options.body instanceof FormData 
            ? { 'Authorization': `Bearer ${token}`, ...options.headers }
            : { ...defaultHeaders, ...options.headers };

        const config = {
            ...options,
            headers
        };

        const response = await fetch(url, config);
        
        // Check if token expired
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        getCurrentUser,
        authenticatedFetch,
        isAuthenticated: !!token && !!user,
        apiUrl: getApiUrl()
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 