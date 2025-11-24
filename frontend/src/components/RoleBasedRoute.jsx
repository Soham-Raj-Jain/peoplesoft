import { Navigate } from 'react-router-dom'

const isAuthed = () => !!localStorage.getItem('token')
const getUserRole = () => localStorage.getItem('role')

// Generic PrivateRoute - requires authentication only
export const PrivateRoute = ({ children }) => {
    return isAuthed() ? children : <Navigate to="/login" replace />
}

// RoleBasedRoute - requires authentication AND specific role(s)
export const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthed()) {
        return <Navigate to="/login" replace />
    }

    const userRole = getUserRole()

    // If no roles specified, any authenticated user can access
    if (allowedRoles.length === 0) {
        return children
    }

    // Check if user's role is in allowedRoles array
    if (allowedRoles.includes(userRole)) {
        return children
    }

    // User doesn't have permission
    return <Navigate to="/unauthorized" replace />
}