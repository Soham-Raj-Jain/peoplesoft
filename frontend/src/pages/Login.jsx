import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useNavigate } from 'react-router-dom'
import client from '../api/client'

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

    if (isLoading) return <div className="text-center mt-5">Loading...</div>

    return (
        <div className="d-flex justify-content-center align-items-center"
             style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

            <div className="card p-4 shadow-sm" style={{ width: '400px' }}>

                <h2 className="text-center mb-4">
                    {isRegister ? "Create PeopleSoft Account" : "PeopleSoft Login"}
                </h2>

                {error && (
                    <div className="alert alert-danger py-2" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input className="form-control"
                                   value={name}
                                   onChange={e => setName(e.target.value)}
                                   required />
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email"
                               className="form-control"
                               value={email}
                               onChange={e => setEmail(e.target.value)}
                               required />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input type="password"
                               className="form-control"
                               value={password}
                               onChange={e => setPassword(e.target.value)}
                               required />
                    </div>

                    <button className="btn w-100 mb-3"
                            disabled={loading}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                fontWeight: '500'
                            }}>
                        {loading ? "Processing..." : (isRegister ? "Create Account" : "Log in")}
                    </button>
                </form>

                {/* 🔄 Toggle Register/Login */}
                <div className="text-center mb-3">
                    <a href="#"
                       onClick={e => {
                           e.preventDefault()
                           setIsRegister(!isRegister)
                       }}>
                        {isRegister ? "Already have an account? Sign in" : "New here? Register"}
                    </a>
                </div>

                {/* Divider */}
                <div className="position-relative my-3">
                    <hr />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted"
                          style={{ fontSize: "13px" }}>
                        OR
                    </span>
                </div>

                {/* Google Login */}
                <button className="btn btn-primary w-100"
                        onClick={handleGoogleLogin}>
                    Sign in with Google (SSO)
                </button>
            </div>
        </div>
    )
}
