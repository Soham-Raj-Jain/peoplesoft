import React from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
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
import Chatbot from './components/Chatbot'

// PrivateRoute component
function PrivateRoute({ children }) {
    const token = localStorage.getItem('token')

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default function App() {
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

    // Hide navigation on login, callback, unauthorized, and dashboard pages
    const hideNavRoutes = ['/login', '/callback', '/unauthorized', '/', '/dashboard']
    const showNav = !hideNavRoutes.includes(location.pathname) && !!localStorage.getItem('token')

    return (
        <div>
            {/* Chatbot - Show on all authenticated pages */}
            {!!localStorage.getItem('token') && <Chatbot />}

            {showNav && (
                <nav style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    padding: '0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    marginBottom: '0'
                }}>
                    <div style={{
                        maxWidth: '1400px',
                        margin: '0 auto',
                        padding: '0 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '70px'
                    }}>
                        <div style={{display: 'flex', gap: '32px', alignItems: 'center', flex: 1}}>
                            <Link to="/" style={{
                                color: location.pathname === '/' || location.pathname === '/dashboard' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/' || location.pathname === '/dashboard' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/' && location.pathname !== '/dashboard') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Dashboard
                            </Link>

                            <Link to="/employees" style={{
                                color: location.pathname === '/employees' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/employees' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/employees') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Employees
                            </Link>

                            <Link to="/leaves" style={{
                                color: location.pathname === '/leaves' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/leaves' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/leaves') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Leaves
                            </Link>

                            <Link to="/performance" style={{
                                color: location.pathname === '/performance' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/performance' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/performance') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Performance
                            </Link>

                            <Link to="/reports/performance" style={{
                                color: location.pathname === '/reports/performance' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/reports/performance' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/reports/performance') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Reports
                            </Link>

                            <Link to="/goals" style={{
                                color: location.pathname === '/goals' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/goals' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/goals') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Goals
                            </Link>

                            <Link to="/self-assessment" style={{
                                color: location.pathname === '/self-assessment' ? '#ffffff' : '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: '500',
                                padding: '24px 0',
                                borderBottom: location.pathname === '/self-assessment' ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.3px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.color = '#ffffff'
                            }}
                            onMouseLeave={e => {
                                if (location.pathname !== '/self-assessment') {
                                    e.target.style.color = '#cbd5e1'
                                }
                            }}>
                                Self Assessment
                            </Link>

                            {/* Manager and HR only */}
                            {(['hr', 'manager'].includes(userRole)) && (
                                <Link to="/manager/review" style={{
                                    color: location.pathname === '/manager/review' ? '#ffffff' : '#cbd5e1',
                                    textDecoration: 'none',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    padding: '24px 0',
                                    borderBottom: location.pathname === '/manager/review' ? '3px solid #667eea' : '3px solid transparent',
                                    transition: 'all 0.3s ease',
                                    letterSpacing: '0.3px'
                                }}
                                onMouseEnter={e => {
                                    e.target.style.color = '#ffffff'
                                }}
                                onMouseLeave={e => {
                                    if (location.pathname !== '/manager/review') {
                                        e.target.style.color = '#cbd5e1'
                                    }
                                }}>
                                    Manager Review
                                </Link>
                            )}
                        </div>

                        <button
                            style={{
                                background: 'transparent',
                                color: '#ff6b6b',
                                border: '2px solid #ff6b6b',
                                padding: '10px 24px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.5px'
                            }}
                            onClick={logout}
                            onMouseEnter={e => {
                                e.target.style.background = '#ff6b6b'
                                e.target.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                                e.target.style.background = 'transparent'
                                e.target.style.color = '#ff6b6b'
                            }}>
                            Logout
                        </button>
                    </div>
                </nav>
            )}

            <div className={showNav ? "container py-4" : ""}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/callback" element={<AuthCallback />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Protected routes */}
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
                    <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                    <Route path="/self-assessment" element={<PrivateRoute><SelfAssessment /></PrivateRoute>} />
                    <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                    <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
                    <Route path="/reports/performance" element={<PrivateRoute><PerfReports /></PrivateRoute>} />
                    <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
                    <Route path="/manager/review" element={<PrivateRoute><ManagerReview /></PrivateRoute>} />
                </Routes>
            </div>
        </div>
    )
}