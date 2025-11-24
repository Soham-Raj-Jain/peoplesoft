import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import client from "../api/client";

export default function AuthCallback() {
    const { isLoading, error, user, getIdTokenClaims, isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const [hasProcessed, setHasProcessed] = useState(false);
    const [callbackError, setCallbackError] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Initializing...");

    useEffect(() => {
        async function finishAuth() {
            // Prevent multiple executions
            if (hasProcessed) {
                console.log('Already processed, skipping');
                return;
            }

            console.log('=== AUTH CALLBACK DEBUG ===');
            console.log('isLoading:', isLoading);
            console.log('isAuthenticated:', isAuthenticated);
            console.log('user:', user);
            console.log('error:', error);
            console.log('hasProcessed:', hasProcessed);
            console.log('========================');

            // Wait for Auth0 to finish loading
            if (isLoading) {
                console.log('Auth0 still loading...');
                setStatusMessage("Loading Auth0...");
                return;
            }

            // If there's an Auth0 error
            if (error) {
                console.error('❌ Auth0 error:', error);
                setCallbackError(`Auth0 Error: ${error.message}`);
                setStatusMessage("Auth0 error occurred");
                setTimeout(() => navigate('/login', { replace: true }), 3000);
                return;
            }

            // If not authenticated
            if (!isAuthenticated) {
                console.error('❌ Not authenticated after callback');
                setCallbackError("Not authenticated");
                setStatusMessage("Not authenticated, redirecting...");
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            // If no user object
            if (!user) {
                console.error('❌ No user object');
                setCallbackError("No user data");
                setStatusMessage("No user data, redirecting...");
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            // Mark as processed
            setHasProcessed(true);
            setStatusMessage("Getting token...");

            try {
                console.log('✅ User authenticated:', user.email);
                console.log('📡 Getting ID token claims...');

                const claims = await getIdTokenClaims();
                console.log('✅ Claims received:', claims);

                const idToken = claims?.__raw;

                if (!idToken) {
                    throw new Error('No ID token in claims');
                }

                console.log('✅ ID token obtained, sending to backend...');
                setStatusMessage("Verifying with backend...");

                // Call your Go backend
                const response = await client.post("/api/auth/auth0-login", {
                    email: user.email,
                    name: user.name || user.email,
                    token: idToken
                });

                console.log('✅ Backend response:', response.data);

                // Store backend-issued JWT token
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("role", response.data.role);
                localStorage.setItem("email", response.data.email);
                localStorage.setItem("name", user.name || user.email);

                console.log('✅ Stored credentials, navigating to dashboard...');
                setStatusMessage("Success! Redirecting...");

                // Navigate to dashboard
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 500);

            } catch (err) {
                console.error("❌ Callback error:", err);
                console.error("❌ Error response:", err.response?.data);
                console.error("❌ Error status:", err.response?.status);

                const errorMsg = err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    'Authentication failed';

                setCallbackError(errorMsg);
                setStatusMessage("Error occurred");
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        }

        finishAuth();
    }, [isLoading, isAuthenticated, user, error, hasProcessed, navigate, getIdTokenClaims]);

    // Show error state
    if (callbackError) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '100px auto',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da'
            }}>
                <h2 style={{ color: '#dc3545' }}>Authentication Error</h2>
                <p style={{ color: '#721c24' }}>{callbackError}</p>
                <p style={{ color: '#856404', fontSize: '14px', marginTop: '20px' }}>
                    Redirecting to login page...
                </p>
                <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="btn btn-danger mt-3"
                >
                    Back to Login Now
                </button>
            </div>
        );
    }

    // Show loading state
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
            <h2>Completing sign-in...</h2>
            <p style={{ color: '#666', fontSize: '18px', marginTop: '10px' }}>
                {statusMessage}
            </p>
            <p style={{ color: '#999', fontSize: '12px', marginTop: '20px' }}>
                Debug: isLoading={isLoading.toString()}, isAuth={isAuthenticated.toString()}
            </p>
        </div>
    );
}