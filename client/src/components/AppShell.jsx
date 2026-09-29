import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brand" to="/dashboard">Leave<span>flow</span></NavLink>
        <nav className="main-nav" aria-label="Primary navigation">
          <NavLink to="/dashboard" end>Dashboard</NavLink>
          <NavLink to="/apply">Apply for leave</NavLink>
          <NavLink to="/requests">My requests</NavLink>
          {user?.role === 'manager' && (
            <span className="manager-nav-group">
              <span className="manager-nav-label">Manager</span>
              <NavLink to="/manager/requests">Review</NavLink>
              <NavLink to="/manager/leave-types">Leave types</NavLink>
            </span>
          )}
        </nav>
        <div className="account-menu">
          <span className="role-pill">{user?.role}</span>
          <button className="text-button" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>
      {children}
    </div>
  );
};

export default AppShell;
