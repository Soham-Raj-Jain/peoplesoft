import React, { useState, useEffect } from 'react'
import client from '../api/client'

export default function PerfReports() {
    const userRole = localStorage.getItem('role')
    const userEmail = localStorage.getItem('email')

    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        period: '',
        status: ''
    })

    useEffect(() => {
        fetchReports()
    }, [filters])

    const fetchReports = async () => {
        try {
            let endpoint = '/api/reports/performance'

            // Employees only see their own
            if (userRole === 'employee') {
                endpoint = '/api/reports/performance/my'
            }
            // Managers see their team
            else if (userRole === 'manager') {
                endpoint = '/api/reports/performance/team'
            }
            // HR sees all (default endpoint)

            const { data } = await client.get(endpoint, { params: filters })
            setReports(data)
        } catch (error) {
            console.error('Failed to fetch reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportToCSV = () => {
        // CSV export logic
        const csvData = reports.map(r => ({
            Employee: r.employee_name,
            Period: r.review_period,
            Score: r.score,
            Status: r.status,
            Department: r.department_name
        }))

        const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    if (loading) {
        return <div className="text-center mt-5">Loading reports...</div>
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Performance Reports</h2>
                <div>
                    <span className="badge bg-secondary me-2">{userRole.toUpperCase()} View</span>
                    <button className="btn btn-success btn-sm" onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Role-based info banner */}
            {userRole === 'employee' && (
                <div className="alert alert-info">
                    <strong>Employee View:</strong> You can view your own performance reports.
                </div>
            )}

            {userRole === 'manager' && (
                <div className="alert alert-success">
                    <strong>Manager View:</strong> You can view performance reports for your team members.
                </div>
            )}

            {userRole === 'hr' && (
                <div className="alert alert-danger">
                    <strong>HR View:</strong> You can view all performance reports across the organization.
                </div>
            )}

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <label className="form-label">Review Period</label>
                            <select
                                className="form-select"
                                value={filters.period}
                                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                            >
                                <option value="">All Periods</option>
                                <option value="Q1 2025">Q1 2025</option>
                                <option value="Q2 2025">Q2 2025</option>
                                <option value="Q3 2025">Q3 2025</option>
                                <option value="Q4 2025">Q4 2025</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h6 className="text-muted">Total Reviews</h6>
                            <h3>{reports.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h6 className="text-muted">Average Score</h6>
                            <h3>
                                {reports.length > 0
                                    ? (reports.reduce((sum, r) => sum + r.score, 0) / reports.length).toFixed(2)
                                    : '0'
                                }
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h6 className="text-muted">Completed</h6>
                            <h3>{reports.filter(r => r.status === 'completed').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h6 className="text-muted">In Progress</h6>
                            <h3>{reports.filter(r => r.status === 'in_progress').length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            {reports.length === 0 ? (
                <div className="alert alert-warning">No reports found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Employee</th>
                            {userRole !== 'employee' && <th>Department</th>}
                            <th>Period</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Completed Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td>{report.employee_name}</td>
                                {userRole !== 'employee' && <td>{report.department_name}</td>}
                                <td>{report.review_period}</td>
                                <td>
                                        <span className={`badge ${
                                            report.score >= 4 ? 'bg-success' :
                                                report.score >= 3 ? 'bg-warning' :
                                                    'bg-danger'
                                        }`}>
                                            {report.score}/5
                                        </span>
                                </td>
                                <td>
                                        <span className={`badge ${
                                            report.status === 'completed' ? 'bg-success' :
                                                report.status === 'in_progress' ? 'bg-warning' :
                                                    'bg-secondary'
                                        }`}>
                                            {report.status}
                                        </span>
                                </td>
                                <td>
                                    {report.completed_at
                                        ? new Date(report.completed_at).toLocaleDateString()
                                        : '-'
                                    }
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}