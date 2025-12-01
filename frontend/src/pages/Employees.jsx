import React, { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import './Dashboard.css'

export default function Employees() {
  const role = localStorage.getItem('role') || 'employee'

  // table data
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  // filters
  const [q, setQ] = useState('')
  const [designation, setDesignation] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  // modal state
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    user_role: 'employee',
    user_id: '',
    designation: '',
    department_id: '',
    manager_id: '',
    phone: '',
    location: ''
  })
  const [err, setErr] = useState('')

  const [myTeamMode, setMyTeamMode] = useState(false)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (designation) p.set('designation', designation)
    if (departmentId) p.set('department_id', departmentId)
    p.set('page', page)
    p.set('page_size', size)
    return p.toString()
  }, [q, designation, departmentId, page, size])

  const load = async () => {
    const url = myTeamMode ? '/api/my-team' : `/api/employees?${queryString}`
    const { data } = await client.get(url)

    let filteredRows = data.data || []

    if (myTeamMode) {
      if (q) {
        const lowerQ = q.toLowerCase()
        filteredRows = filteredRows.filter(r =>
          r.name?.toLowerCase().includes(lowerQ) ||
          r.email?.toLowerCase().includes(lowerQ)
        )
      }
      if (designation) {
        const lowerDesig = designation.toLowerCase()
        filteredRows = filteredRows.filter(r =>
          r.designation?.toLowerCase().includes(lowerDesig)
        )
      }
      if (departmentId) {
        filteredRows = filteredRows.filter(r =>
          String(r.department_id) === departmentId
        )
      }
    }

    setRows(filteredRows)
    setTotal(
      typeof data.total === 'number'
        ? data.total
        : filteredRows.length
    )
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [queryString, myTeamMode])

  // ----- actions -----
  const openAdd = () => {
    setIsEdit(false)
    setCurrentId(null)
    setCurrentUserId(null)
    setForm({
      name: '',
      email: '',
      password: '',
      user_role: 'employee',
      user_id: '',
      designation: '',
      department_id: '',
      manager_id: '',
      phone: '',
      location: ''
    })
    setErr('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setIsEdit(true)
    setCurrentId(row.id)
    setCurrentUserId(row.user_id)
    setForm({
      name: row.name || '',
      email: row.email || '',
      password: '',
      user_role: 'employee',
      user_id: row.user_id ?? '',
      designation: row.designation || '',
      department_id: row.department_id || '',
      manager_id: (row.manager_id ?? '') || '',
      phone: row.phone || '',
      location: row.location || ''
    })
    setErr('')
    setShowModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      if (isEdit) {
        const payload = {
          ...(form.designation ? { designation: form.designation } : {}),
          ...(form.department_id ? { department_id: Number(form.department_id) } : {}),
          ...(form.manager_id !== '' ? { manager_id: form.manager_id === null ? null : Number(form.manager_id) } : { manager_id: null }),
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.location ? { location: form.location } : {})
        }
        await client.put(`/api/employees/${currentId}`, payload)
      } else {
        // Onboarding: Create user first, then employee
        const userPayload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.user_role,
          department_id: form.department_id ? Number(form.department_id) : null
        }

        await client.post('/api/auth/register', userPayload)

        const { data: userData } = await client.get(`/api/users/by-email/${form.email}`)
        console.log('User data received:', userData)
        const employeePayload = {
          user_id: userData.id,
          designation: form.designation,
          department_id: form.department_id ? Number(form.department_id) : 0,
          manager_id: form.manager_id ? Number(form.manager_id) : null,
          phone: form.phone,
          location: form.location
        }
        console.log('Employee payload:', employeePayload)
        await client.post('/api/employees', employeePayload)
      }
      setShowModal(false)
      await load()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Operation failed')
    }
  }

  const offboard = async (employeeId, userId, employeeName) => {
    if (!window.confirm(`Are you sure you want to offboard ${employeeName}?`)) return

    try {
      await client.delete(`/api/employees/${employeeId}`)
      await client.delete(`/api/users/${userId}`)
      await load()
    } catch (e) {
      alert('Offboarding failed: ' + (e?.response?.data?.error || 'Unknown error'))
    }
  }

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div className="glass-panel glass-header">
          <h3 className="glass-title">
            Employee Directory
          </h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            {(role === 'manager' || role === 'hr') && (
              <button
                className={`btn-gradient-secondary ${myTeamMode ? 'active' : ''}`}
                onClick={() => { setMyTeamMode(m => !m); setPage(1) }}
              >
                {myTeamMode ? 'All Employees' : 'My Team'}
              </button>
            )}

            {role === 'hr' && (
              <button
                className="btn-gradient"
                onClick={openAdd}
              >
                Onboard
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="input-styled"
                placeholder="Search name or email"
                value={q}
                onChange={e => { setPage(1); setQ(e.target.value) }}
              />
            </div>
            <div className="col-md-3">
              <input
                className="input-styled"
                placeholder="Designation"
                value={designation}
                onChange={e => { setPage(1); setDesignation(e.target.value) }}
              />
            </div>
            <div className="col-md-3">
              <input
                className="input-styled"
                placeholder="Department ID"
                value={departmentId}
                onChange={e => { setPage(1); setDepartmentId(e.target.value) }}
              />
            </div>
            <div className="col-md-2">
              <select
                className="select-styled"
                value={size}
                onChange={e => { setPage(1); setSize(Number(e.target.value)) }}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
          {myTeamMode && (
            <div className="info-banner-glass" style={{ marginTop: '12px' }}>
              Showing only your direct reports
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table-styled">
            <thead>
              <tr>
                <th>EmpID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                {!myTeamMode && <th>Manager</th>}
                <th>Phone</th>
                <th>Location</th>
                {(role === 'hr' || role === 'manager') && <th style={{ width: '200px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="id-badge">
                      {r.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', color: '#2d3748' }}>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.designation}</td>
                  {!myTeamMode && <td>{r.manager_name || '-'}</td>}
                  <td>{r.phone}</td>
                  <td>{r.location}</td>
                  {(role === 'hr' || role === 'manager') && (
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn-gradient"
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                          onClick={() => openEdit(r)}
                        >
                          Edit
                        </button>
                        {role === 'hr' && (
                          <button
                            className="btn-gradient"
                            style={{
                              padding: '6px 14px',
                              fontSize: '13px',
                              background: 'rgba(239, 68, 68, 0.8)',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                            onClick={() => offboard(r.id, r.user_id, r.name)}
                          >
                            Offboard
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          padding: '0 10px'
        }}>
          <small style={{ color: 'white', fontSize: '14px', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            Total: {total}
          </small>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-gradient-secondary"
              style={{ background: page <= 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)' }}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <button
              className="btn-gradient-secondary"
              style={{ background: (page * size) >= total ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)' }}
              disabled={(page * size) >= total}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <form onSubmit={save}>
                  <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                    <h5 className="modal-title" style={{ fontWeight: '600' }}>{isEdit ? 'Edit Employee' : 'Onboard Employee'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    {err && <div className="alert alert-danger">{err}</div>}

                    {!isEdit && (
                      <>
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Full Name *</label>
                            <input className="form-control" value={form.name}
                              onChange={e => setForm({ ...form, name: e.target.value })} required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-control" value={form.email}
                              onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="new-email" required />

                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Password *</label>
                            <input type="password" className="form-control" value={form.password}
                              onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Role *</label>
                            <select className="form-select" value={form.user_role}
                              onChange={e => setForm({ ...form, user_role: e.target.value })} required>
                              <option value="employee">Employee</option>
                              <option value="manager">Manager</option>
                              <option value="hr">HR/Admin</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Designation *</label>
                        <input className="form-control" value={form.designation}
                          onChange={e => setForm({ ...form, designation: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Department ID *</label>
                        <input type="number" className="form-control" value={form.department_id}
                          onChange={e => setForm({ ...form, department_id: e.target.value })} required />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Manager ID</label>
                        <input type="number" className="form-control" value={form.manager_id}
                          onChange={e => setForm({ ...form, manager_id: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input className="form-control" value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Location</label>
                      <input className="form-control" value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })} />
                    </div>
                  </div>

                  <div className="modal-footer" style={{ borderTop: '1px solid #eee' }}>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn-gradient">
                      {isEdit ? 'Save Changes' : 'Onboard Employee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}