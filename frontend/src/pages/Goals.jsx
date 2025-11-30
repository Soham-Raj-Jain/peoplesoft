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
      'draft': { color: 'gray', text: 'Draft' },
      'hr_assigned': { color: 'blue', text: 'Assigned by HR' },
      'manager_assigned': { color: 'blue', text: 'Assigned by Manager' },
      'manager_accepted': { color: 'green', text: 'Accepted' },
      'employee_accepted': { color: 'green', text: 'Accepted' },
      'manager_submitted': { color: 'orange', text: 'Submitted to HR' },
      'employee_submitted': { color: 'orange', text: 'Submitted to Manager' },
      'manager_approved': { color: 'purple', text: 'Manager Approved' },
      'hr_approved': { color: 'darkgreen', text: 'HR Approved' }
    };
    const s = statusMap[status] || { color: 'gray', text: status };
    return <span style={{ 
      backgroundColor: s.color, 
      color: 'white', 
      padding: '4px 8px', 
      borderRadius: '4px',
      fontSize: '12px'
    }}>{s.text}</span>;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🎯 Goals Management</h1>

      {/* Role-based info banner */}
      <div className="info-banner info-banner-blue">
        <strong>{role?.toUpperCase()} View:</strong>{' '}
        {role === 'hr' && 'Assign goals to managers, review their performance.'}
        {role === 'manager' && 'Accept goals from HR, assign to your team, review employee work.'}
        {role === 'employee' && 'Accept goals from manager, track progress, submit for approval.'}
      </div>

      {/* Cycle Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Review Cycle:</label>
        <select 
          value={cycleId} 
          onChange={(e) => setCycleId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="1">Cycle 1 - Q1 2025</option>
          <option value="2">Cycle 2 - Q2 2025</option>
          <option value="3">Cycle 3 - Q3 2025</option>
          <option value="4">Cycle 4 - Q4 2025</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <button 
          onClick={() => setActiveTab('my-goals')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'my-goals' ? '#4A90E2' : 'transparent',
            color: activeTab === 'my-goals' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'my-goals' ? '3px solid #4A90E2' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          My Goals
        </button>

        <button 
          onClick={() => setActiveTab('assigned')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'assigned' ? '#4A90E2' : 'transparent',
            color: activeTab === 'assigned' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'assigned' ? '3px solid #4A90E2' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Assigned to Me
        </button>

        {(['manager', 'hr'].includes(role)) && (
          <button 
            onClick={() => setActiveTab('assign')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'assign' ? '#4A90E2' : 'transparent',
              color: activeTab === 'assign' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'assign' ? '3px solid #4A90E2' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Assign Goals
          </button>
        )}

        {(['manager', 'hr'].includes(role)) && (
          <button 
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'approvals' ? '#4A90E2' : 'transparent',
              color: activeTab === 'approvals' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'approvals' ? '3px solid #4A90E2' : 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Pending Approvals
          </button>
        )}
      </div>

      {error && <div className="info-banner info-banner-error">{error}</div>}
      {loading && <p>Loading...</p>}

      {/* TAB: My Goals */}
      {activeTab === 'my-goals' && (
        <div className="card">
          <h2>My Self-Created Goals</h2>
          <form onSubmit={createGoal} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input
                type="text"
                placeholder="Goal Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-yearly</option>
                <option value="annual">Annual</option>
              </select>
              <button type="submit" className="btn-primary">Create Goal</button>
            </div>
          </form>

          <table className="data-table">
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
                    <td>{g.Title || g.title}</td>
                    <td>{g.Timeline || g.timeline}</td>
                    <td>{getStatusBadge(g.Status || g.status)}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={g.Progress || g.progress || 0}
                        onBlur={(e) => updateProgress(id, e.target.value)}
                        style={{ width: '80px', padding: '5px' }}
                      />%
                    </td>
                  </tr>
                );
              })}
              {myGoals.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No goals yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: Assigned to Me */}
      {activeTab === 'assigned' && (
        <div className="card">
          <h2>Goals Assigned to Me</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {role === 'manager' && 'Goals assigned by HR. Accept, work on them, and submit for approval.'}
            {role === 'employee' && 'Goals assigned by your manager. Accept, complete, and submit.'}
          </p>

          <table className="data-table">
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
  const canSubmit = status === 'accepted' || status === 'in_progress'; // ✅ FIX THIS LINE

  return (
    <tr key={id}>
      <td>{g.Title || g.title}</td>
      <td>{g.Timeline || g.timeline}</td>
      <td>{getStatusBadge(status)}</td>
      <td>{g.Progress || g.progress || 0}%</td>
      <td>
        {canAccept && (
          <button onClick={() => acceptGoal(id)} className="btn-primary">Accept</button>
        )}
        {canSubmit && (
          <button onClick={() => submitGoal(id)} className="btn-primary" style={{ marginLeft: '5px' }}>
            Submit for Approval
          </button>
        )}
        {status === 'submitted' && (
          <span style={{ color: '#999' }}>Waiting for approval...</span>
        )}
        {status === 'approved' && (
          <span style={{ color: 'green' }}>✓ Approved</span>
        )}
      </td>
    </tr>
  );
})}
              {assignedGoals.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No assigned goals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: Assign Goals */}
      {activeTab === 'assign' && role === 'manager' && (
        <div className="card">
          <h2>Assign Goals to Team Members</h2>
          <form onSubmit={assignToEmployee} style={{ display: 'grid', gap: '10px' }}>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Select Team Member</option>
              {teamMembers.map(m => (
                <option key={m.id || m.ID} value={m.user_id || m.UserID}>
                  {m.name || m.Name} - {m.designation || m.Designation}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Goal Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-yearly</option>
              <option value="annual">Annual</option>
            </select>
            <button type="submit" className="btn-primary">Assign to Employee</button>
          </form>
        </div>
      )}

      {activeTab === 'assign' && role === 'hr' && (
        <div className="card">
          <h2>Assign Goals to Managers</h2>
          <form onSubmit={assignToManager} style={{ display: 'grid', gap: '10px' }}>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Select Manager</option>
              {managers.map(m => (
                <option key={m.id || m.ID} value={m.user_id || m.UserID}>
                  {m.name || m.Name} - {m.designation || m.Designation}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Goal Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-yearly</option>
              <option value="annual">Annual</option>
            </select>
            <button type="submit" className="btn-primary">Assign to Manager</button>
          </form>
        </div>
      )}

      {/* TAB: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="card">
          <h2>Pending Approvals</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {role === 'manager' && 'Review and approve employee goal submissions.'}
            {role === 'hr' && 'Review and approve manager goal submissions.'}
          </p>

          <table className="data-table">
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
                      {g.employee_name || g.EmployeeName}<br/>
                      <small style={{ color: '#999' }}>{g.employee_email || g.EmployeeEmail}</small>
                    </td>
                    <td>{g.Title || g.title}</td>
                    <td>{getStatusBadge(g.Status || g.status)}</td>
                    <td>{g.Progress || g.progress || 0}%</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={reviewRating[id] || 4}
                        onChange={(e) => setReviewRating({ ...reviewRating, [id]: Number(e.target.value) })}
                        style={{ width: '60px', padding: '5px' }}
                      />
                    </td>
                    <td>
                      <textarea
                        rows={2}
                        value={reviewComments[id] || ''}
                        onChange={(e) => setReviewComments({ ...reviewComments, [id]: e.target.value })}
                        placeholder="Review comments..."
                        style={{ width: '200px', padding: '5px' }}
                      />
                    </td>
                    <td>
                      <button onClick={() => approveGoal(id)} className="btn-primary">
                        Approve & Review
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pendingApprovals.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>No pending approvals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}