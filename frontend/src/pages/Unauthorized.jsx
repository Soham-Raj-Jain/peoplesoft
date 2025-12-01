import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Unauthorized() {
    const navigate = useNavigate()
    const userRole = localStorage.getItem('role')
    const userEmail = localStorage.getItem('email')

    return (
        <div className="dashboard-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
                <div className="mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="#ef4444" className="bi bi-shield-x" viewBox="0 0 16 16">
                        <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z" />
                        <path d="M6.146 5.146a.5.5 0 0 1 .708 0L8 6.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 7l1.147 1.146a.5.5 0 0 1-.708.708L8 7.707 6.854 8.854a.5.5 0 1 1-.708-.708L7.293 7 6.146 5.854a.5.5 0 0 1 0-.708z" />
                    </svg>
                </div>

                <h2 className="glass-title" style={{ color: '#ef4444', marginBottom: '20px' }}>Access Denied</h2>

                <div className="info-banner-glass" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', textAlign: 'left', marginBottom: '20px' }}>
                    <div><strong>Your Role:</strong> {userRole?.toUpperCase() || 'Unknown'}</div>
                    <div><strong>Email:</strong> {userEmail}</div>
                </div>

                <p style={{ color: '#64748b', marginBottom: '30px' }}>
                    You don't have permission to access this page.
                    <br />
                    Please contact your administrator if you believe this is an error.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        className="btn-gradient"
                        onClick={() => navigate('/')}
                    >
                        Go to Dashboard
                    </button>
                    <button
                        className="btn-gradient-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}