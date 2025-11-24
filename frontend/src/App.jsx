import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Leaves from './pages/Leaves'
import Performance from './pages/Performance'
import Goals from './pages/Goals'
import SelfAssessment from './pages/SelfAssessment'
import ManagerReview from './pages/ManagerReview'
import PerfReports from './pages/PerfReports'
import Onboarding from './pages/Onboarding'
import AuthCallback from './pages/AuthCallback'

const isAuthed = () => !!localStorage.getItem('token')

const PrivateRoute = ({ children }) => (
    isAuthed() ? children : <Navigate to="/login" replace />
)

export default function App() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout: auth0Logout } = useAuth0()

    const logout = () => {
        localStorage.clear()
        auth0Logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        })
    }

    // Hide navigation on login and callback pages
    const hideNavRoutes = ['/login', '/callback']
    const showNav = !hideNavRoutes.includes(location.pathname)

    return (
        <div className="container py-4">
            {showNav && (
                <nav className="d-flex gap-3 mb-4">
                    <Link to="/">Dashboard</Link>
                    <Link to="/employees">Employees</Link>
                    <Link to="/leaves">Leaves</Link>
                    <Link to="/performance">Performance</Link>
                    <Link to="/goals">Goals</Link>
                    <Link to="/self-assessment">Self Assessment</Link>
                    <Link to="/manager/review">Manager Review</Link>
                    <Link to="/reports/performance">Performance Reports</Link>
                    <button className="btn btn-link ms-auto" onClick={logout}>Logout</button>
                </nav>
            )}

            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<AuthCallback />} />
                <Route path="/onboarding" element={<Onboarding />} />

                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
                <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
                <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
                <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                <Route path="/self-assessment" element={<PrivateRoute><SelfAssessment /></PrivateRoute>} />
                <Route path="/manager/review" element={<PrivateRoute><ManagerReview /></PrivateRoute>} />
                <Route path="/reports/performance" element={<PrivateRoute><PerfReports /></PrivateRoute>} />
            </Routes>
        </div>
    )
}