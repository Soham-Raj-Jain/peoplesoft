import React, { useState, useEffect } from 'react';
import client from '../api/client';
import './Dashboard.css';

export default function Performance() {
  const role = localStorage.getItem('role');
  const [activeTab, setActiveTab] = useState('reviews');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [comment, setComment] = useState('');
  const [scoreUpdate, setScoreUpdate] = useState({});

  // Reports
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ period: '', status: '' });

  // Self Assessment
  const [cycleId, setCycleId] = useState('1');
  const [selfComments, setSelfComments] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [assessmentMsg, setAssessmentMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'reviews') {
        await loadReviews();
      } else if (activeTab === 'reports') {
        await loadReports();
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    let endpoint = '/api/pms/my-reviews'; // Default: reviews I received

    if (role === 'manager') {
      // Manager sees reviews they've GIVEN
      endpoint = '/api/pms/reviews-given';
    } else if (role === 'hr') {
      // HR sees all reviews
      endpoint = '/api/pms/all-reviews';
    }

    const { data } = await client.get(endpoint);
    setReviews(data.data || data || []);
  };

  const loadReports = async () => {
    const { data } = await client.get('/api/pms/reports/performance', { params: filters });
    setReports(data.data || []);
  };

  const addComment = async (reviewId) => {
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      await client.post(`/api/performance/${reviewId}/comment`, { comment });
      setComment('');
      setSelectedReview(null);
      loadReviews();
      alert('Comment added successfully!');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to add comment');
    }
  };

  const updateScore = async (reviewId, score) => {
    try {
      await client.put(`/api/performance/${reviewId}`, { score: parseFloat(score) });
      loadReviews();
      alert('Score updated!');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update score');
    }
  };

  const submitSelfAssessment = async (e) => {
    e.preventDefault();
    setError('');
    setAssessmentMsg('');

    try {
      const payload = {
        cycle_id: Number(cycleId),
        comments: selfComments
      };
      if (selfRating) payload.rating = Number(selfRating);

      await client.post('/api/pms/self-assess', payload);
      setAssessmentMsg('✓ Self-assessment submitted successfully!');
      setSelfComments('');
      setSelfRating('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Submit failed');
    }
  };

  const exportToCSV = () => {
    const csvData = reports.map(r => ({
      Employee: r.employee_name || r.EmployeeName,
      Department: r.department_name || r.DepartmentName,
      Cycle: r.cycle_id || r.CycleID,
      AvgRating: r.avg_rating || r.AvgRating,
      GoalsTotal: r.goals_total || r.GoalsTotal,
      GoalsCompleted: r.goals_completed || r.GoalsCompleted,
      Status: r.status || r.Status
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': 'status-success',
      'in_progress': 'status-warning',
      'pending': 'status-neutral',
      'draft': 'status-neutral',
      'final': 'status-success'
    };
    const cssClass = statusMap[status] || 'status-neutral';
    return (
      <span className={`status-badge ${cssClass}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div className="glass-panel glass-header">
          <h1 className="glass-title">⭐ Performance Management</h1>
        </div>

        {/* Role Info Banner */}
        <div className="info-banner-glass">
          <strong>{role?.toUpperCase()} View:</strong>{' '}
          {role === 'employee' && 'View your reviews, submit self-assessments, and track feedback.'}
          {role === 'manager' && 'Review your team\'s performance and provide feedback.'}
          {role === 'hr' && 'Full access to all performance data and analytics.'}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            Performance Reviews
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          >
            Reports & Analytics
          </button>

          <button
            onClick={() => setActiveTab('self-assessment')}
            className={`tab-btn ${activeTab === 'self-assessment' ? 'active' : ''}`}
          >
            Self Assessment
          </button>
        </div>

        {error && <div className="info-banner-glass" style={{ color: '#dc2626', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}
        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>}

        {/* TAB: Reviews */}
        {activeTab === 'reviews' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Performance Reviews</h2>

            {reviews.length === 0 ? (
              <div className="info-banner-glass" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }}>No reviews found</div>
            ) : (
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      {role !== 'employee' && <th>Employee</th>}
                      <th>Review Period</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Comments</th>
                      {['manager', 'hr'].includes(role) && <th>Score</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => {
                      const id = review.id || review.ID;
                      const rating = review.rating || review.Rating;
                      const status = review.status || review.Status;

                      return (
                        <tr key={id}>
                          {role !== 'employee' && (
                            <td style={{ fontWeight: '500' }}>{review.employee_name || review.EmployeeName || 'N/A'}</td>
                          )}
                          <td>{review.review_period || review.ReviewPeriod || 'Q4 2024'}</td>
                          <td>
                            <span style={{
                              backgroundColor: rating >= 4 ? '#48bb78' : rating >= 3 ? '#ed8936' : '#f56565',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}>
                              {rating}/5
                            </span>
                          </td>
                          <td>{getStatusBadge(status)}</td>
                          <td>
                            <small style={{ color: '#666' }}>
                              {review.comments || review.Comments || 'No comments'}
                            </small>
                          </td>
                          {['manager', 'hr'].includes(role) && (
                            <td>
                              <input
                                type="number"
                                className="input-styled"
                                min="0"
                                max="5"
                                step="0.1"
                                defaultValue={review.score || review.Score}
                                onBlur={(e) => updateScore(id, e.target.value)}
                                style={{ width: '70px', padding: '6px' }}
                              />
                            </td>
                          )}
                          <td>
                            <button
                              onClick={() => setSelectedReview(review)}
                              className="btn-gradient"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Add Comment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Comment Modal (Bootstrap Style) */}
            {selectedReview && (
              <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                  <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                      <h5 className="modal-title" style={{ fontWeight: '600' }}>Add Comment</h5>
                      <button type="button" className="btn-close" onClick={() => {
                        setSelectedReview(null);
                        setComment('');
                      }}></button>
                    </div>
                    <div className="modal-body">
                      <p><strong>Employee:</strong> {selectedReview.employee_name || selectedReview.EmployeeName || 'You'}</p>
                      <p><strong>Period:</strong> {selectedReview.review_period || selectedReview.ReviewPeriod}</p>

                      <textarea
                        className="input-styled"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Enter your feedback or comments..."
                      />
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid #eee' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSelectedReview(null);
                          setComment('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-gradient"
                        onClick={() => addComment(selectedReview.id || selectedReview.ID)}
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
        )}

        {/* TAB: Reports */}
        {activeTab === 'reports' && (
          <div>
            {/* Filters */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Filters</h3>
              <div className="row g-3">
                <div className="col-md-4">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                    Review Period
                  </label>
                  <select
                    className="select-styled"
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                    Status
                  </label>
                  <select
                    className="select-styled"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="col-md-4" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={exportToCSV} className="btn-gradient" style={{ width: '100%' }}>
                    📊 Export to CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-number">{reports.length}</div>
                  <div className="stat-label">Total Reviews</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-number">
                    {reports.length > 0
                      ? (reports.reduce((sum, r) => sum + (r.avg_rating || r.AvgRating || 0), 0) / reports.length).toFixed(2)
                      : '0'
                    }
                  </div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-number">
                    {reports.reduce((sum, r) => sum + (r.goals_completed || r.GoalsCompleted || 0), 0)}
                  </div>
                  <div className="stat-label">Goals Completed</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-number">
                    {reports.reduce((sum, r) => sum + (r.goals_total || r.GoalsTotal || 0), 0)}
                  </div>
                  <div className="stat-label">Total Goals</div>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Performance Reports</h2>

              {reports.length === 0 ? (
                <div className="info-banner-glass" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }}>No reports found</div>
              ) : (
                <div className="table-container">
                  <table className="table-styled">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        {role !== 'employee' && <th>Department</th>}
                        <th>Cycle</th>
                        <th>Avg Rating</th>
                        <th>Goals</th>
                        <th>Completion %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report, idx) => {
                        const completed = report.goals_completed || report.GoalsCompleted || 0;
                        const total = report.goals_total || report.GoalsTotal || 1;
                        const percentage = Math.round((completed / total) * 100);

                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: '500' }}>{report.employee_name || report.EmployeeName}</td>
                            {role !== 'employee' && (
                              <td>{report.department_name || report.DepartmentName}</td>
                            )}
                            <td>Cycle {report.cycle_id || report.CycleID}</td>
                            <td>
                              <span style={{
                                backgroundColor: (report.avg_rating || report.AvgRating) >= 4 ? '#48bb78' : '#ed8936',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {(report.avg_rating || report.AvgRating || 0).toFixed(2)}
                              </span>
                            </td>
                            <td>{completed} / {total}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  flex: 1,
                                  height: '8px',
                                  backgroundColor: '#e0e0e0',
                                  borderRadius: '10px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    backgroundColor: percentage >= 80 ? '#48bb78' : percentage >= 50 ? '#ed8936' : '#f56565',
                                    transition: 'width 0.3s'
                                  }} />
                                </div>
                                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{percentage}%</span>
                              </div>
                            </td>
                            <td>{getStatusBadge(report.status || report.Status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Self Assessment */}
        {activeTab === 'self-assessment' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Submit Self Assessment</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Reflect on your performance and provide a self-assessment for the review cycle.
            </p>

            <form onSubmit={submitSelfAssessment} style={{ maxWidth: '600px' }}>
              <div className="mb-3">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                  Review Cycle
                </label>
                <select
                  className="select-styled"
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  required
                >
                  <option value="1">Cycle 1 - Q1 2025</option>
                  <option value="2">Cycle 2 - Q2 2025</option>
                  <option value="3">Cycle 3 - Q3 2025</option>
                  <option value="4">Cycle 4 - Q4 2025</option>
                </select>
              </div>

              <div className="mb-3">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                  Self Rating (Optional)
                </label>
                <select
                  className="select-styled"
                  value={selfRating}
                  onChange={(e) => setSelfRating(e.target.value)}
                >
                  <option value="">Select rating...</option>
                  <option value="5">5 - Exceptional</option>
                  <option value="4">4 - Exceeds Expectations</option>
                  <option value="3">3 - Meets Expectations</option>
                  <option value="2">2 - Needs Improvement</option>
                  <option value="1">1 - Unsatisfactory</option>
                </select>
              </div>

              <div className="mb-4">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                  Comments & Reflections
                </label>
                <textarea
                  className="input-styled"
                  rows={6}
                  value={selfComments}
                  onChange={(e) => setSelfComments(e.target.value)}
                  placeholder="Describe your achievements, challenges, and areas for growth..."
                  required
                />
              </div>

              <button type="submit" className="btn-gradient">
                Submit Self Assessment
              </button>

              {assessmentMsg && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {assessmentMsg}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}