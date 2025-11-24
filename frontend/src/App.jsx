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
import Unauthorized from './pages/Unauthorized'
import { PrivateRoute, RoleBasedRoute } from './components/RoleBasedRoute'

export default function App() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout: auth0Logout } = useAuth0()

    const userRole = localStorage.getItem('role')

    const logout = () => {
        localStorage.clear()
        auth0Logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        })
    }

    // Hide navigation on login, callback, and unauthorized pages
    const hideNavRoutes = ['/login', '/callback', '/unauthorized']
    const showNav = !hideNavRoutes.includes(location.pathname) && !!localStorage.getItem('token')

    return (
        <div className="container py-4">
            {showNav && (
                <nav className="d-flex gap-3 mb-4 flex-wrap align-items-center">
                    <Link to="/">Dashboard</Link>

                    {/* HR and Manager can see Employees */}
                    {(['hr', 'manager'].includes(userRole)) && (
                        <Link to="/employees">Employees</Link>
                    )}

                    {/* Everyone can see Leaves */}
                    <Link to="/leaves">Leaves</Link>

                    {/* HR only */}
                    {userRole === 'hr' && (
                        <>
                            <Link to="/performance">Performance</Link>
                            <Link to="/reports/performance">Reports</Link>
                        </>
                    )}

                    {/* Everyone */}
                    <Link to="/goals">Goals</Link>
                    <Link to="/self-assessment">Self Assessment</Link>

                    {/* Manager and HR */}
                    {(['hr', 'manager'].includes(userRole)) && (
                        <Link to="/manager/review">Manager Review</Link>
                    )}

                    <button className="btn btn-link ms-auto" onClick={logout}>Logout</button>
                </nav>
            )}

            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<AuthCallback />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* All authenticated users */}
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
                <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                <Route path="/self-assessment" element={<PrivateRoute><SelfAssessment /></PrivateRoute>} />
                <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

                {/* Manager and HR only */}
                <Route path="/employees" element={
                    <RoleBasedRoute allowedRoles={['manager', 'hr']}>
                        <Employees />
                    </RoleBasedRoute>
                } />

                <Route path="/manager/review" element={
                    <RoleBasedRoute allowedRoles={['manager', 'hr']}>
                        <ManagerReview />
                    </RoleBasedRoute>
                } />

                {/* HR only */}
                <Route path="/performance" element={
                    <RoleBasedRoute allowedRoles={['hr']}>
                        <Performance />
                    </RoleBasedRoute>
                } />

                <Route path="/reports/performance" element={
                    <RoleBasedRoute allowedRoles={['hr']}>
                        <PerfReports />
                    </RoleBasedRoute>
                } />
            </Routes>
        </div>
    )
}