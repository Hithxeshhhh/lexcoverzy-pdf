import LoginForm from "./LoginForm";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show login form
    if (!isAuthenticated) {
        return <LoginForm />;
    }

    // If authenticated, render the protected content
    return children;
};

export default ProtectedRoute; 