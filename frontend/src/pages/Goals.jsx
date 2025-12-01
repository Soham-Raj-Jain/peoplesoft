import React, { useEffect, useState } from 'react';
import client from '../api/client';
import './Dashboard.css';

export default function Goals() {
  const role = localStorage.getItem('role');
  const [activeTab, setActiveTab] = useState('my-goals');

  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cycleId, setCycleId] = useState('1');

  // My Goals (self-created)
  const [myGoals, setMyGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('quarterly');

  // Assigned Goals (from HR/Manager)
  const [assignedGoals, setAssignedGoals] = useState([]);

  // For Manager: Assign to employees
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // For HR: Assign to managers
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');

  // Pending Approvals
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [reviewRating, setReviewRating] = useState({});
  const [reviewComments, setReviewComments] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab, cycleId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'my-goals') {
        await loadMyGoals();
      } else if (activeTab === 'assigned') {
        await loadAssignedGoals();
      } else if (activeTab === 'assign') {
        if (role === 'manager') {
          await loadTeamMembers();
        } else if (role === 'hr') {
          await loadManagers();
        }
      } else if (activeTab === 'approvals') {
        await loadPendingApprovals();
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load my self-created goals
  const loadMyGoals = async () => {
    const { data } = await client.get(`/api/pms/my-goals?cycle_id=${cycleId}`);
    setMyGoals(data.data || []);
  };

  // Load goals assigned to me
  const loadAssignedGoals = async () => {
    const { data } = await client.get(`/api/pms/my-assigned-goals?cycle_id=${cycleId}`);
    setAssignedGoals(data.data || []);
  };

  // Load team members (for manager)
  const loadTeamMembers = async () => {
    const { data } = await client.get('/api/employees/team');
    setTeamMembers(data.data || []);
  };

  // Load managers (for HR)
  const loadManagers = async () => {
    const { data } = await client.get('/api/employees?role=manager');
    setManagers(data.data || []);
  };

  // Load pending approvals
  const loadPendingApprovals = async () => {
    const { data } = await client.get('/api/pms/pending-approvals');
    setPendingApprovals(data.data || []);

    // Initialize review forms
    const ratings = {};
    const comments = {};
    (data.data || []).forEach(g => {
      ratings[g.ID || g.id] = 4;
      comments[g.ID || g.id] = '';
    });
    setReviewRating(ratings);
    setReviewComments(comments);
  };

  // Create self goal
  const createGoal = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/pms/goals', {
        cycle_id: Number(cycleId),
        title,
        description,
        timeline
      });
      setTitle('');
      setDescription('');
      loadMyGoals();
    } catch (err) {
      setError(err?.response?.data?.error || 'Create failed');
    }
  };

  // Update goal progress
  const updateProgress = async (goalId, progress) => {
    try {
      await client.put(`/api/pms/goals/${goalId}`, { progress: Number(progress) });
      loadMyGoals();
    } catch (err) {
      alert('Update failed');
    }
  };

  // Accept assigned goal
  const acceptGoal = async (goalId) => {
    try {
      await client.post(`/api/pms/goals/${goalId}/accept`);
      alert('Goal accepted! You can now work on it.');
      loadAssignedGoals();
    } catch (err) {
      alert(err?.response?.data?.error || 'Accept failed');
    }
  };

  // Submit goal for approval
  const submitGoal = async (goalId) => {
    const comments = prompt('Add submission comments (optional):');
    try {
      await client.post(`/api/pms/goals/${goalId}/submit`, {
        progress: 100,
        comments: comments || ''
      });
      alert('Goal submitted for approval!');
      loadAssignedGoals();
    } catch (err) {
      alert(err?.response?.data?.error || 'Submit failed');
    }
  };

  // Assign goal to employee (Manager)
  const assignToEmployee = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/pms/manager/assign-goals', {
        cycle_id: Number(cycleId),
        employee_id: Number(selectedEmployee),
        title,
        description,
        timeline
      });
      alert('Goal assigned to employee!');
      setTitle('');
      setDescription('');
      setSelectedEmployee('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Assignment failed');
    }
  };

  // Assign goal to manager (HR)
  const assignToManager = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/pms/hr/assign-goals', {
        cycle_id: Number(cycleId),
        manager_id: Number(selectedManager),
        title,
        description,
        timeline
      });
      alert('Goal assigned to manager!');
      setTitle('');
      setDescription('');
      setSelectedManager('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Assignment failed');
    }
  };

  // Approve goal and create review
  const approveGoal = async (goalId) => {
    try {
      await client.post(`/api/pms/reviews/${goalId}/approve`, {
        rating: reviewRating[goalId] || 4,
        comments: reviewComments[goalId] || '',
        score: reviewRating[goalId] || 4
      });
      alert('Goal approved and review created!');
      loadPendingApprovals();
    } catch (err) {
      alert(err?.response?.data?.error || 'Approval failed');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': 'status-neutral',
      'hr_assigned': 'status-neutral',
      'manager_assigned': 'status-neutral',
      'manager_accepted': 'status-success',
      'employee_accepted': 'status-success',
      'manager_submitted': 'status-warning',
      'employee_submitted': 'status-warning',
      'manager_approved': 'status-success',
      'hr_approved': 'status-success'
    };
    const cssClass = statusMap[status] || 'status-neutral';
    const text = status ? status.replace(/_/g, ' ') : 'Unknown';
    return <span className={`status-badge ${cssClass}`}>{text}</span>;
  };

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div className="glass-panel glass-header">
          <h1 className="glass-title">🎯 Goals Management</h1>

          {/* Cycle Selector */}
          <div>
            <select
              className="select-styled"
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="1">Cycle 1 - Q1 2025</option>
              <option value="2">Cycle 2 - Q2 2025</option>
              <option value="3">Cycle 3 - Q3 2025</option>
              <option value="4">Cycle 4 - Q4 2025</option>
            </select>
          </div>
        </div>

        {/* Role-based info banner */}
        <div className="info-banner-glass">
          <strong>{role?.toUpperCase()} View:</strong>{' '}
          {role === 'hr' && 'Assign goals to managers, review their performance.'}
          {role === 'manager' && 'Accept goals from HR, assign to your team, review employee work.'}
          {role === 'employee' && 'Accept goals from manager, track progress, submit for approval.'}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('my-goals')}
            className={`tab-btn ${activeTab === 'my-goals' ? 'active' : ''}`}
          >
            My Goals
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
          >
            Assigned to Me
          </button>

          {(['manager', 'hr'].includes(role)) && (
            <button
              onClick={() => setActiveTab('assign')}
              className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`}
            >
              Assign Goals
            </button>
          )}

          {(['manager', 'hr'].includes(role)) && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            >
              Pending Approvals
            </button>
          )}
        </div>

        {error && <div className="info-banner-glass" style={{ color: '#dc2626', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}
        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>}

        {/* TAB: My Goals */}
        {activeTab === 'my-goals' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>My Self-Created Goals</h2>
            <form onSubmit={createGoal} style={{ marginBottom: '20px' }}>
              <div className="row g-3">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Goal Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="select-styled"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button type="submit" className="btn-gradient" style={{ width: '100%' }}>Create</button>
                </div>
              </div>
            </form>

            <div className="table-container">
              <table className="table-styled">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Timeline</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {myGoals.map(g => {
                    const id = g.ID || g.id;
                    return (
                      <tr key={id}>
                        <td style={{ fontWeight: '500' }}>{g.Title || g.title}</td>
                        <td>{g.Timeline || g.timeline}</td>
                        <td>{getStatusBadge(g.Status || g.status)}</td>
                        <td>
                          <input
                            type="number"
                            className="input-styled"
                            min="0"
                            max="100"
                            defaultValue={g.Progress || g.progress || 0}
                            onBlur={(e) => updateProgress(id, e.target.value)}
                            style={{ width: '80px', padding: '6px' }}
                          />%
                        </td>
                      </tr>
                    );
                  })}
                  {myGoals.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No goals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Assigned to Me */}
        {activeTab === 'assigned' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Goals Assigned to Me</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {role === 'manager' && 'Goals assigned by HR. Accept, work on them, and submit for approval.'}
              {role === 'employee' && 'Goals assigned by your manager. Accept, complete, and submit.'}
            </p>

            <div className="table-container">
              <table className="table-styled">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Timeline</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedGoals.map(g => {
                    const id = g.ID || g.id;
                    const status = g.Status || g.status;
                    const canAccept = (role === 'manager' && status === 'hr_assigned') ||
                      (role === 'employee' && status === 'manager_assigned');
                    const canSubmit = status === 'accepted' || status === 'in_progress' || status === 'manager_accepted' || status === 'employee_accepted';

                    return (
                      <tr key={id}>
                        <td style={{ fontWeight: '500' }}>{g.Title || g.title}</td>
                        <td>{g.Timeline || g.timeline}</td>
                        <td>{getStatusBadge(status)}</td>
                        <td>{g.Progress || g.progress || 0}%</td>
                        <td>
                          {canAccept && (
                            <button onClick={() => acceptGoal(id)} className="btn-gradient" style={{ padding: '6px 12px', fontSize: '12px' }}>Accept</button>
                          )}
                          {canSubmit && (
                            <button onClick={() => submitGoal(id)} className="btn-gradient" style={{ marginLeft: '5px', padding: '6px 12px', fontSize: '12px' }}>
                              Submit
                            </button>
                          )}
                          {(status === 'manager_submitted' || status === 'employee_submitted') && (
                            <span style={{ color: '#999', fontSize: '13px' }}>Waiting approval...</span>
                          )}
                          {(status === 'manager_approved' || status === 'hr_approved') && (
                            <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✓ Approved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {assignedGoals.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No assigned goals</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Assign Goals */}
        {activeTab === 'assign' && role === 'manager' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Assign Goals to Team Members</h2>
            <form onSubmit={assignToEmployee}>
              <div className="row g-3">
                <div className="col-md-3">
                  <select
                    className="select-styled"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="">Select Team Member</option>
                    {teamMembers.map(m => (
                      <option key={m.id || m.ID} value={m.user_id || m.UserID}>
                        {m.name || m.Name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Goal Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="select-styled"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <button type="submit" className="btn-gradient" style={{ width: '100%' }}>Assign</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'assign' && role === 'hr' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Assign Goals to Managers</h2>
            <form onSubmit={assignToManager}>
              <div className="row g-3">
                <div className="col-md-3">
                  <select
                    className="select-styled"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    required
                  >
                    <option value="">Select Manager</option>
                    {managers.map(m => (
                      <option key={m.id || m.ID} value={m.user_id || m.UserID}>
                        {m.name || m.Name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Goal Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="select-styled"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <button type="submit" className="btn-gradient" style={{ width: '100%' }}>Assign</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB: Pending Approvals */}
        {activeTab === 'approvals' && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#1e293b' }}>Pending Approvals</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {role === 'manager' && 'Review and approve employee goal submissions.'}
              {role === 'hr' && 'Review and approve manager goal submissions.'}
            </p>

            <div className="table-container">
              <table className="table-styled">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Rating (1-5)</th>
                    <th>Comments</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map(g => {
                    const id = g.ID || g.id;
                    return (
                      <tr key={id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{g.employee_name || g.EmployeeName}</div>
                          <small style={{ color: '#64748b' }}>{g.employee_email || g.EmployeeEmail}</small>
                        </td>
                        <td>{g.Title || g.title}</td>
                        <td>{getStatusBadge(g.Status || g.status)}</td>
                        <td>{g.Progress || g.progress || 0}%</td>
                        <td>
                          <input
                            type="number"
                            className="input-styled"
                            min="1"
                            max="5"
                            value={reviewRating[id] || 4}
                            onChange={(e) => setReviewRating({ ...reviewRating, [id]: Number(e.target.value) })}
                            style={{ width: '60px', padding: '6px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-styled"
                            value={reviewComments[id] || ''}
                            onChange={(e) => setReviewComments({ ...reviewComments, [id]: e.target.value })}
                            placeholder="Comments..."
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <button onClick={() => approveGoal(id)} className="btn-gradient" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingApprovals.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No pending approvals</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}