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
    const colors = {
      'completed': '#48bb78',
      'in_progress': '#ed8936',
      'pending': '#4299e1',
      'draft': '#a0aec0',
      'final': '#48bb78'
    };
    const color = colors[status] || '#a0aec0';
    return (
      <span style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">⭐ Performance Management</h1>

      {/* Role Info Banner */}
      <div className="info-banner info-banner-blue">
        <strong>{role?.toUpperCase()} View:</strong>{' '}
        {role === 'employee' && 'View your reviews, submit self-assessments, and track feedback.'}
        {role === 'manager' && 'Review your team\'s performance and provide feedback.'}
        {role === 'hr' && 'Full access to all performance data and analytics.'}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <button 
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'reviews' ? '#4A90E2' : 'transparent',
            color: activeTab === 'reviews' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'reviews' ? '3px solid #4A90E2' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Performance Reviews
        </button>

        <button 
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'reports' ? '#4A90E2' : 'transparent',
            color: activeTab === 'reports' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid #4A90E2' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Reports & Analytics
        </button>

        <button 
          onClick={() => setActiveTab('self-assessment')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'self-assessment' ? '#4A90E2' : 'transparent',
            color: activeTab === 'self-assessment' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'self-assessment' ? '3px solid #4A90E2' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Self Assessment
        </button>
      </div>

      {error && <div className="info-banner info-banner-error">{error}</div>}
      {loading && <p>Loading...</p>}

      {/* TAB: Reviews */}
      {activeTab === 'reviews' && (
        <div className="card">
          <h2>Performance Reviews</h2>
          
          {reviews.length === 0 ? (
            <div className="info-banner info-banner-yellow">No reviews found</div>
          ) : (
            <table className="data-table">
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
                        <td>{review.employee_name || review.EmployeeName || 'N/A'}</td>
                      )}
                      <td>{review.review_period || review.ReviewPeriod || 'Q4 2024'}</td>
                      <td>
                        <span style={{
                          backgroundColor: rating >= 4 ? '#48bb78' : rating >= 3 ? '#ed8936' : '#f56565',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
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
                            min="0"
                            max="5"
                            step="0.1"
                            defaultValue={review.score || review.Score}
                            onBlur={(e) => updateScore(id, e.target.value)}
                            style={{ width: '70px', padding: '5px' }}
                          />
                        </td>
                      )}
                      <td>
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Add Comment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Comment Modal */}
          {selectedReview && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '30px',
                maxWidth: '500px',
                width: '90%'
              }}>
                <h3>Add Comment</h3>
                <p><strong>Employee:</strong> {selectedReview.employee_name || selectedReview.EmployeeName || 'You'}</p>
                <p><strong>Period:</strong> {selectedReview.review_period || selectedReview.ReviewPeriod}</p>
                
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your feedback or comments..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      setComment('');
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ccc',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addComment(selectedReview.id || selectedReview.ID)}
                    disabled={!comment.trim()}
                    className="btn-primary"
                  >
                    Submit Comment
                  </button>
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
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Review Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">All Periods</option>
                  <option value="Q1 2025">Q1 2025</option>
                  <option value="Q2 2025">Q2 2025</option>
                  <option value="Q3 2025">Q3 2025</option>
                  <option value="Q4 2025">Q4 2025</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={exportToCSV} className="btn-primary" style={{ width: '100%' }}>
                  📊 Export to CSV
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-number">{reports.length}</div>
              <div className="stat-label">Total Reviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {reports.length > 0
                  ? (reports.reduce((sum, r) => sum + (r.avg_rating || r.AvgRating || 0), 0) / reports.length).toFixed(2)
                  : '0'
                }
              </div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {reports.reduce((sum, r) => sum + (r.goals_completed || r.GoalsCompleted || 0), 0)}
              </div>
              <div className="stat-label">Goals Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {reports.reduce((sum, r) => sum + (r.goals_total || r.GoalsTotal || 0), 0)}
              </div>
              <div className="stat-label">Total Goals</div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="card">
            <h2>Performance Reports</h2>
            
            {reports.length === 0 ? (
              <div className="info-banner info-banner-yellow">No reports found</div>
            ) : (
              <table className="data-table">
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
                        <td>{report.employee_name || report.EmployeeName}</td>
                        {role !== 'employee' && (
                          <td>{report.department_name || report.DepartmentName}</td>
                        )}
                        <td>Cycle {report.cycle_id || report.CycleID}</td>
                        <td>
                          <span style={{
                            backgroundColor: (report.avg_rating || report.AvgRating) >= 4 ? '#48bb78' : '#ed8936',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {(report.avg_rating || report.AvgRating || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>{completed} / {total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              flex: 1,
                              height: '20px',
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
                            <span style={{ fontWeight: 'bold' }}>{percentage}%</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(report.status || report.Status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: Self Assessment */}
      {activeTab === 'self-assessment' && (
        <div className="card">
          <h2>Submit Self Assessment</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Reflect on your performance and provide a self-assessment for the review cycle.
          </p>

          <form onSubmit={submitSelfAssessment} style={{ display: 'grid', gap: '15px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Review Cycle
              </label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              >
                <option value="1">Cycle 1 - Q1 2025</option>
                <option value="2">Cycle 2 - Q2 2025</option>
                <option value="3">Cycle 3 - Q3 2025</option>
                <option value="4">Cycle 4 - Q4 2025</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Self Rating (Optional)
              </label>
              <select
                value={selfRating}
                onChange={(e) => setSelfRating(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select rating...</option>
                <option value="5">5 - Exceptional</option>
                <option value="4">4 - Exceeds Expectations</option>
                <option value="3">3 - Meets Expectations</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Unsatisfactory</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Comments & Reflections
              </label>
              <textarea
                rows={6}
                value={selfComments}
                onChange={(e) => setSelfComments(e.target.value)}
                placeholder="Describe your achievements, challenges, and areas for growth..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              Submit Self Assessment
            </button>

            {assessmentMsg && (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                color: '#155724',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                {assessmentMsg}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}