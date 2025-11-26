import React, { useEffect, useState } from 'react'
import client from '../api/client'

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
  const canApprove = role === 'manager'

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

  return (
    <div>
      {/* Header + view buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Leave Management</h3>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${
              view === 'my' ? 'btn-primary' : 'btn-outline-primary'
            }`}
            onClick={loadMy}
          >
            My Leaves
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              view === 'team' ? 'btn-primary' : 'btn-outline-primary'
            }`}
            onClick={loadTeam}
          >
            My Team
          </button>
        </div>
      </div>

      {/* Balances on My Leaves */}
      {view === 'my' && balances.length > 0 && (
        <div className="mb-3">
          <h6>Annual Leave Balance</h6>
          <div className="d-flex flex-wrap gap-2">
            {balances.map((b) => (
              <div
                key={b.type}
                className="badge bg-light text-dark border"
                style={{ fontSize: '0.85rem' }}
              >
                {b.type.toUpperCase()}: {b.remaining} / {b.total} day(s)
                remaining
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Request form */}
      <form onSubmit={submit} className="card card-body mb-3">
        <div className="row g-2">
          <div className="col">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              min={today}
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
              required
            />
          </div>
          <div className="col">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              min={form.start_date || today}
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
              required
            />
          </div>
          <div className="col">
            <label className="form-label">Type</label>
            <select
              className="form-select"
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
          <div className="col">
            <label className="form-label">Reason</label>
            <input
              className="form-control"
              placeholder="Reason"
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
              required
            />
          </div>
          <div className="col-auto d-flex align-items-end">
            <button className="btn btn-primary">Request</button>
          </div>
        </div>
      </form>

      {/* Leaves table */}
      <table className="table table-bordered">
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const id = r.id || r.ID
            const status = (r.status || r.Status || '').toLowerCase()
            const canAct = canApprove && status === 'pending'

            const userName =
              r.user_name || r.UserName || r.user_id || r.UserID
            const approvedByName =
              r.approved_by_name || r.ApprovedByName || '-'

            return (
              <tr key={id}>
                <td>{id}</td>
                <td>{userName}</td>
                <td>
                  {(r.start_date || r.StartDate || '').slice(0, 10)}
                </td>
                <td>
                  {(r.end_date || r.EndDate || '').slice(0, 10)}
                </td>
                <td>{(r.type || r.Type || '').toUpperCase()}</td>
                <td>{r.reason || r.Reason}</td>
                <td style={{ textTransform: 'capitalize' }}>{status}</td>
                <td>{approvedByName}</td>
                <td className="d-flex gap-2">
                  {canAct && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => approve(id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => reject(id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}

          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-muted">
                No leaves found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
