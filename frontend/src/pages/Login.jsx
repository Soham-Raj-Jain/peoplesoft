import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useNavigate } from 'react-router-dom'
import client from '../api/client'
import './Dashboard.css'

export default function Login() {
    const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (isAuthenticated && localStorage.getItem('token')) {
        return <Navigate to="/" replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isRegister) {
                // REGISTER API
                await client.post('/api/auth/register', { name, email, password })
            }

            // LOGIN API
            const { data } = await client.post('/api/auth/login', { email, password })

            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)
            localStorage.setItem('email', data.email)

            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        loginWithRedirect({
            authorizationParams: {
                connection: 'google-oauth2',
                prompt: 'select_account'
            }
        })
    }

    if (isLoading) return <div className="text-center mt-5" style={{ color: 'white' }}>Loading...</div>

    return (
        <div className="dashboard-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 className="glass-title" style={{ fontSize: '28px', marginBottom: '10px' }}>
                        {isRegister ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        {isRegister ? "Sign up to get started" : "Enter your credentials to access your account"}
                    </p>
                </div>

                {error && (
                    <div className="info-banner-glass" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        padding: '12px',
                        fontSize: '14px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="mb-3">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Name</label>
                            <input
                                className="input-styled"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    )}

                    <div className="mb-3">
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Email</label>
                        <input
                            type="email"
                            className="input-styled"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Password</label>
                        <input
                            type="password"
                            className="input-styled"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        className="btn-gradient"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', marginBottom: '20px' }}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : (isRegister ? "Create Account" : "Sign In")}
                    </button>
                </form>

                {/* 🔄 Toggle Register/Login */}
                <div className="text-center mb-4">
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'none'
                        }}
                        onClick={e => {
                            e.preventDefault()
                            setIsRegister(!isRegister)
                            setError('')
                        }}>
                        {isRegister ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </button>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                </div>

                {/* Google Login */}
                <button
                    className="btn-gradient-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={handleGoogleLogin}>
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fillRule="evenodd" fillOpacity="1" fill="#4285f4" stroke="none"></path>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fillRule="evenodd" fillOpacity="1" fill="#34a853" stroke="none"></path>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fillRule="evenodd" fillOpacity="1" fill="#fbbc05" stroke="none"></path>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fillRule="evenodd" fillOpacity="1" fill="#ea4335" stroke="none"></path>
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    )
}
