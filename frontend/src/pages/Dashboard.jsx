import React from 'react'

export default function Dashboard() {
    const userRole = localStorage.getItem('role')
    const userEmail = localStorage.getItem('email')
    const userName = localStorage.getItem('name')

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Dashboard</h1>

            {/* User Info Card */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Welcome, {userName}!</h5>
                    <div className="row mt-3">
                        <div className="col-md-6">
                            <strong>Email:</strong> {userEmail}
                        </div>
                        <div className="col-md-6">
                            <strong>Role:</strong>
                            <span className={`badge ms-2 ${
                                userRole === 'hr' ? 'bg-danger' :
                                    userRole === 'manager' ? 'bg-success' :
                                        'bg-secondary'
                            }`}>
                                {userRole?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role-based content */}
            {userRole === 'hr' && (
                <div className="card border-danger">
                    <div className="card-header bg-danger text-white">
                        <h4 className="mb-0">HR Dashboard</h4>
                    </div>
                    <div className="card-body">
                        <h5>Your Permissions:</h5>
                        <ul>
                            <li>✅ Manage all employees</li>
                            <li>✅ View and approve all leave requests</li>
                            <li>✅ Access performance reports</li>
                            <li>✅ Conduct and view all reviews</li>
                            <li>✅ Full system access</li>
                        </ul>
                    </div>
                </div>
            )}

            {userRole === 'manager' && (
                <div className="card border-success">
                    <div className="card-header bg-success text-white">
                        <h4 className="mb-0">Manager Dashboard</h4>
                    </div>
                    <div className="card-body">
                        <h5>Your Permissions:</h5>
                        <ul>
                            <li>✅ View team members</li>
                            <li>✅ Approve team leave requests</li>
                            <li>✅ Conduct performance reviews</li>
                            <li>✅ Manage team goals</li>
                            <li>❌ Cannot access HR-only features</li>
                        </ul>
                    </div>
                </div>
            )}

            {userRole === 'employee' && (
                <div className="card border-secondary">
                    <div className="card-header bg-secondary text-white">
                        <h4 className="mb-0">Employee Dashboard</h4>
                    </div>
                    <div className="card-body">
                        <h5>Your Permissions:</h5>
                        <ul>
                            <li>✅ View your profile</li>
                            <li>✅ Submit leave requests</li>
                            <li>✅ Complete self-assessments</li>
                            <li>✅ View your goals</li>
                            <li>❌ Cannot access manager or HR features</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}