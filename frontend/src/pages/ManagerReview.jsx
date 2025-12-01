import React, { useState } from 'react'
import client from '../api/client'
import './Dashboard.css'

export default function ManagerReview() {
  const [employeeId, setEmployeeId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [goals, setGoals] = useState([])
  const [rating, setRating] = useState('')
  const [comments, setComments] = useState('')
  const [status, setStatus] = useState('final')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const loadGoals = async () => {
    setErr(''); setMsg('')
    try {
      const { data } = await client.get(`/api/pms/manager/goals?employee_id=${employeeId}&cycle_id=${cycleId}`)
      setGoals(data.data || [])
    } catch (e) {
      setErr(e?.response?.data?.error || 'Load failed')
    }
  }

  const submitReview = async () => {
    setErr(''); setMsg('')
    try {
      await client.post('/api/pms/reviews', {
        employee_id: Number(employeeId),
        cycle_id: Number(cycleId),
        rating: Number(rating),
        comments,
        status
      })
      setMsg('Review saved')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Save failed')
    }
  }

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        <div className="glass-panel glass-header">
          <h3 className="glass-title">Manager Review</h3>
        </div>

        <div className="glass-panel">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Employee ID</label>
              <input
                className="input-styled"
                placeholder="ID"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Cycle ID</label>
              <input
                className="input-styled"
                placeholder="Cycle"
                value={cycleId}
                onChange={e => setCycleId(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn-gradient-secondary"
                style={{ width: '100%' }}
                onClick={loadGoals}
              >
                Load Goals
              </button>
            </div>
            <div className="col-md-2">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Rating</label>
              <select
                className="select-styled"
                value={rating}
                onChange={e => setRating(e.target.value)}
              >
                <option value="">Select Rating</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Comments</label>
              <input
                className="input-styled"
                placeholder="Comments"
                value={comments}
                onChange={e => setComments(e.target.value)}
              />
            </div>
            <div className="col-md-1">
              <button className="btn-gradient" style={{ width: '100%' }} onClick={submitReview}>Save</button>
            </div>
          </div>

          {msg && <div className="info-banner-glass" style={{ marginTop: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>{msg}</div>}
          {err && <div className="info-banner-glass" style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>{err}</div>}
        </div>

        <div className="glass-panel">
          <h6 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Employee Goals</h6>
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr><th>Title</th><th>Status</th><th>Progress</th></tr>
              </thead>
              <tbody>
                {goals.map(g => (
                  <tr key={g.ID || g.id}>
                    <td style={{ fontWeight: '500' }}>{g.Title || g.title}</td>
                    <td>
                      <span className={`status-badge ${(g.Status || g.status) === 'approved' ? 'status-success' : 'status-neutral'
                        }`}>
                        {g.Status || g.status}
                      </span>
                    </td>
                    <td>{g.Progress ?? g.progress ?? 0}%</td>
                  </tr>
                ))}
                {goals.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No goals loaded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
