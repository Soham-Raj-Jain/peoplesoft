import React, { useState, useEffect } from 'react'
import client from '../api/client'
import './Dashboard.css'

export default function Onboarding() {
  const [onboardedEmployees, setOnboardedEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department_id: '',
    designation: '',
    phone: '',
    location: ''
  })

  useEffect(() => {
    loadOnboarded()
  }, [])

  const loadOnboarded = async () => {
    try {
      const { data } = await client.get('/api/employees')
      setOnboardedEmployees(data.data || [])
    } catch (e) {
      console.error('Failed to load employees')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')

    try {
      // Step 1: Create user account
      const userPayload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null
      }

      await client.post('/api/auth/register', userPayload)

      // Step 2: Get the created user's ID
      const { data: userData } = await client.get(`/api/users/by-email/${form.email}`)

      // Step 3: Create employee record
      const employeePayload = {
        user_id: userData.id,
        designation: form.designation,
        department_id: form.department_id ? Number(form.department_id) : 0,
        phone: form.phone,
        location: form.location
      }

      await client.post('/api/employees', employeePayload)

      setMsg('Employee onboarded successfully!')
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department_id: '',
        designation: '',
        phone: '',
        location: ''
      })
      setShowForm(false)
      loadOnboarded()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Onboarding failed')
    }
  }

  const offboardEmployee = async (employeeId, userId) => {
    if (!confirm('Are you sure you want to offboard this employee?')) return

    try {
      await client.delete(`/api/employees/${employeeId}`)
      await client.delete(`/api/users/${userId}`)
      setMsg('Employee offboarded successfully')
      loadOnboarded()
    } catch (e) {
      setErr('Offboarding failed')
    }
  }

  return (
    <div className="dashboard-container">
      <div style={{ width: '100%' }}>
        <div className="glass-panel glass-header">
          <h3 className="glass-title">Employee Onboarding</h3>
          <button
            className="btn-gradient"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Onboard New Employee'}
          </button>
        </div>

        {msg && <div className="info-banner-glass" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>{msg}</div>}
        {err && <div className="info-banner-glass" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>{err}</div>}

        {showForm && (
          <div className="glass-panel">
            <h5 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>New Employee Details</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Full Name *</label>
                  <input
                    className="input-styled"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Email *</label>
                  <input
                    type="email"
                    className="input-styled"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Password *</label>
                  <input
                    type="password"
                    className="input-styled"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Role *</label>
                  <select
                    className="select-styled"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR/Admin</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Department ID *</label>
                  <input
                    type="number"
                    className="input-styled"
                    value={form.department_id}
                    onChange={e => setForm({ ...form, department_id: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Designation *</label>
                  <input
                    className="input-styled"
                    value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Phone</label>
                  <input
                    className="input-styled"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>Location</label>
                  <input
                    className="input-styled"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="col-12 mt-4">
                  <button type="submit" className="btn-gradient">
                    Onboard Employee
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="glass-panel">
          <h5 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Onboarded Employees</h5>
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {onboardedEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: '500' }}>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td><span className="status-badge status-neutral">{emp.role || '-'}</span></td>
                    <td>{emp.designation}</td>
                    <td>{emp.department_id}</td>
                    <td>{emp.phone}</td>
                    <td>{emp.location}</td>
                    <td>
                      <button
                        className="btn-gradient"
                        style={{ background: 'rgba(239, 68, 68, 0.8)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => offboardEmployee(emp.id, emp.user_id)}
                      >
                        Offboard
                      </button>
                    </td>
                  </tr>
                ))}
                {onboardedEmployees.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}