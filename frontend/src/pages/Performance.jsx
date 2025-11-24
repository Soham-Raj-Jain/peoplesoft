import React, { useState, useEffect } from 'react'
import client from '../api/client'

export default function Performance() {
    const userRole = localStorage.getItem('role')
    const userEmail = localStorage.getItem('email')

    const [performances, setPerformances] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPerformance, setSelectedPerformance] = useState(null)
    const [comment, setComment] = useState('')

    useEffect(() => {
        fetchPerformances()
    }, [])

    const fetchPerformances = async () => {
        try {
            let endpoint = '/api/performance'

            // Employees only see their own
            if (userRole === 'employee') {
                endpoint = '/api/performance/my'
            }
            // Managers see their team
            else if (userRole === 'manager') {
                endpoint = '/api/performance/team'
            }
            // HR sees all (default endpoint)

            const { data } = await client.get(endpoint)
            setPerformances(data)
        } catch (error) {
            console.error('Failed to fetch performances:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddComment = async (performanceId) => {
        if (!comment.trim()) return

        try {
            await client.post(`/api/performance/${performanceId}/comment`, {
                comment: comment
            })

            setComment('')
            setSelectedPerformance(null)
            fetchPerformances() // Refresh list
            alert('Comment added successfully!')
        } catch (error) {
            console.error('Failed to add comment:', error)
            alert('Failed to add comment')
        }
    }

    const handleUpdateScore = async (performanceId, score) => {
        try {
            await client.put(`/api/performance/${performanceId}`, {
                score: parseFloat(score)
            })

            fetchPerformances()
            alert('Score updated successfully!')
        } catch (error) {
            console.error('Failed to update score:', error)
            alert('Failed to update score')
        }
    }

    if (loading) {
        return <div className="text-center mt-5">Loading performances...</div>
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Performance Reviews</h2>
                <span className="badge bg-secondary">{userRole.toUpperCase()} View</span>
            </div>

            {/* Role-based info banner */}
            {userRole === 'employee' && (
                <div className="alert alert-info">
                    <strong>Employee View:</strong> You can view your performance reviews and add comments.
                </div>
            )}

            {userRole === 'manager' && (
                <div className="alert alert-success">
                    <strong>Manager View:</strong> You can view and edit performance reviews for your team members.
                </div>
            )}

            {userRole === 'hr' && (
                <div className="alert alert-danger">
                    <strong>HR View:</strong> You have full access to all performance reviews.
                </div>
            )}

            {performances.length === 0 ? (
                <div className="alert alert-warning">No performance reviews found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Period</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Comments</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {performances.map((perf) => (
                            <tr key={perf.id}>
                                <td>{perf.employee_name}</td>
                                <td>{perf.review_period}</td>
                                <td>
                                    {/* Manager and HR can edit score */}
                                    {['manager', 'hr'].includes(userRole) ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            className="form-control form-control-sm"
                                            style={{ width: '80px' }}
                                            defaultValue={perf.score}
                                            onBlur={(e) => handleUpdateScore(perf.id, e.target.value)}
                                        />
                                    ) : (
                                        <span className="badge bg-primary">{perf.score}/5</span>
                                    )}
                                </td>
                                <td>
                                        <span className={`badge ${
                                            perf.status === 'completed' ? 'bg-success' :
                                                perf.status === 'in_progress' ? 'bg-warning' :
                                                    'bg-secondary'
                                        }`}>
                                            {perf.status}
                                        </span>
                                </td>
                                <td>
                                    <small className="text-muted">
                                        {perf.comments || 'No comments'}
                                    </small>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setSelectedPerformance(perf)}
                                    >
                                        Add Comment
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Comment Modal */}
            {selectedPerformance && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Comment</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => {
                                        setSelectedPerformance(null)
                                        setComment('')
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Employee:</strong> {selectedPerformance.employee_name}</p>
                                <p><strong>Period:</strong> {selectedPerformance.review_period}</p>

                                <div className="mb-3">
                                    <label className="form-label">Your Comment:</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Enter your feedback or comments..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedPerformance(null)
                                        setComment('')
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleAddComment(selectedPerformance.id)}
                                    disabled={!comment.trim()}
                                >
                                    Submit Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}