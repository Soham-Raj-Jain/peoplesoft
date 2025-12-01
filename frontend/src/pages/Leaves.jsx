import React, { useEffect, useState } from 'react'
import client from '../api/client'
import './Dashboard.css'

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'vacation', label: 'Vacation Leave' },
]

// Count working days (Mon–Fri) between two dates (inclusive)
const workingDaysBetween = (startStr, endStr) => {
  if (!startStr || !endStr) return 0
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (end < start) return 0

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay() // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function Leaves() {
  const [rows, setRows] = useState([])
  const [balances, setBalances] = useState([])
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    type: 'sick',
    reason: '',
  })
  const [view, setView] = useState('my') // 'my' | 'team'
  const [error, setError] = useState('')

  const role = localStorage.getItem('role') || ''

  const isManager = role === 'manager'
  const isHR = role === 'hr'

  // Managers can approve only in "My Team"; HR can approve always
  const canApprove = (isManager && view === 'team') || isHR
  // Any user can withdraw their own pending leaves in "My Leaves"
  const canWithdraw = view === 'my'
  // Show Action column only if there is any possible action
  const showActionColumn = canApprove || canWithdraw

  const today = new Date().toISOString().slice(0, 10)

  const loadMy = async () => {
    setError('')
    const [leavesRes, balRes] = await Promise.all([
      client.get('/api/leaves/my'),
      client.get('/api/leaves/balance'),
    ])
    setRows(leavesRes.data.data || [])
    setBalances(balRes.data.data || [])
    setView('my')
  }

  const loadTeam = async () => {
    setError('')
    const { data } = await client.get('/api/leaves/team')
    setRows(data.data || [])
    setView('team')
  }

  useEffect(() => {
    loadMy()
  }, [])

  const getRemainingForType = (type) => {
    const rec = balances.find((b) => b.type === type)
    return rec ? rec.remaining : null
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const days = workingDaysBetween(form.start_date, form.end_date)
    if (days <= 0) {
      setError('Please select at least one working day (weekends are ignored).')
      return
    }

    const remaining = getRemainingForType(form.type)
    if (remaining != null && days > remaining) {
      setError(
        `You only have ${remaining} ${form.type} day(s) remaining, but selected ${days}.`
      )
      return
    }

    await client.post('/api/leaves', form)

    setForm({
      start_date: '',
      end_date: '',
      type: form.type, // keep last selected type
      reason: '',
    })

    if (view === 'team') {
      loadTeam()
    } else {
      loadMy()
    }
  }

  const approve = async (id) => {
    await client.put(`/api/leaves/${id}/approve`)
    view === 'team' ? loadTeam() : loadMy()
  }

  const reject = async (id) => {
    await client.put(`/api/leaves/${id}/reject`)
    view === 'team' ? loadTeam() : loadMy()
  }

  const withdraw = async (id) => {
    await client.put(`/api/leaves/${id}/withdraw`)
    view === 'team' ? loadTeam() : loadMy()
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'approved': 'status-success',
      'rejected': 'status-error',
      'withdrawn': 'status-neutral',
      'pending': 'status-warning'
    };
    const cssClass = statusMap[status?.toLowerCase()] || 'status-neutral';
    return <span className={`status-badge ${cssClass}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        {/* Header Card + view buttons */}
        <div className="glass-panel glass-header">
          <h3 className="glass-title">Leave Management</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={`btn-gradient-secondary ${view === 'my' ? 'active' : ''}`}
              onClick={loadMy}
            >
              My Leaves
            </button>
            <button
              type="button"
              className={`btn-gradient-secondary ${view === 'team' ? 'active' : ''}`}
              onClick={loadTeam}
            >
              My Team
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="info-banner-glass" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Main Layout with Sidebar */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexDirection: 'row' }}>
          {/* Sidebar - Leave Balance */}
          {view === 'my' && balances.length > 0 && (
            <div style={{ width: '280px', flexShrink: 0 }}>
              <div className="glass-panel" style={{ position: 'sticky', top: '20px' }}>
                <h6 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  Annual Leave Balance
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {balances.map((b) => (
                    <div
                      key={b.type}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                        {b.type.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700' }}>
                        {b.remaining} / {b.total}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                        day(s) remaining
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div style={{ flex: 1 }}>
            {/* Request form */}
            <form onSubmit={submit} className="glass-panel">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Start Date</label>
                  <input
                    type="date"
                    className="input-styled"
                    min={today}
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>End Date</label>
                  <input
                    type="date"
                    className="input-styled"
                    min={form.start_date || today}
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Type</label>
                  <select
                    className="select-styled"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Reason</label>
                  <input
                    className="input-styled"
                    placeholder="Reason"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-gradient" style={{ padding: '10px 40px' }}>Request</button>
              </div>
            </form>

            {/* Leaves table */}
            <div className="table-container">
              <table className="table-styled">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Approved By</th>
                    {showActionColumn && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const id = r.id || r.ID
                    const status = (r.status || r.Status || '').toLowerCase()
                    const userName = r.user_name || r.UserName || r.user_id || r.UserID
                    const approvedByName = r.approved_by_name || r.ApprovedByName || '-'

                    const canActApprove = canApprove && status === 'pending'
                    const canActWithdraw = canWithdraw && status === 'pending'

                    return (
                      <tr key={id}>
                        <td><span className="id-badge">{id}</span></td>
                        <td style={{ fontWeight: '500' }}>{userName}</td>
                        <td>{(r.start_date || r.StartDate || '').slice(0, 10)}</td>
                        <td>{(r.end_date || r.EndDate || '').slice(0, 10)}</td>
                        <td style={{ fontWeight: '600' }}>{(r.type || r.Type || '').toUpperCase()}</td>
                        <td>{r.reason || r.Reason}</td>
                        <td>{getStatusBadge(status)}</td>
                        <td>{approvedByName}</td>

                        {showActionColumn && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {canActApprove && (
                                <>
                                  <button
                                    className="btn-gradient"
                                    style={{
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      padding: '6px 14px',
                                      fontSize: '13px',
                                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onClick={() => approve(id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn-gradient"
                                    style={{
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      padding: '6px 14px',
                                      fontSize: '13px',
                                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                    }}
                                    onClick={() => reject(id)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {canActWithdraw && (
                                <button
                                  className="btn-gradient-secondary"
                                  style={{
                                    color: '#dc2626',
                                    borderColor: 'rgba(220, 38, 38, 0.6)',
                                    padding: '6px 14px',
                                    fontSize: '13px'
                                  }}
                                  onClick={() => withdraw(id)}
                                >
                                  Withdraw
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={showActionColumn ? 9 : 8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No leaves found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
