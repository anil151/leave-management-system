import { Link, Route, Routes } from 'react-router-dom';
import './App.css';
import ApplyLeave from './pages/ApplyLeave';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import ManageLeaveTypes from './pages/ManageLeaveTypes';
import ManagerRequests from './pages/ManagerRequests';
import MyLeaveRequests from './pages/MyLeaveRequests';
import NotAuthorized from './pages/NotAuthorized';
import Register from './pages/Register';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';

const NotFound = () => (
  <main className="simple-page">
    <p className="eyebrow">404</p>
    <h1>That page does not exist.</h1>
    <Link className="button-link" to="/">Return home</Link>
  </main>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/apply" element={<PrivateRoute><ApplyLeave /></PrivateRoute>} />
      <Route path="/requests" element={<PrivateRoute><MyLeaveRequests /></PrivateRoute>} />
      <Route
        path="/manager/requests"
        element={(
          <PrivateRoute>
            <RoleRoute allowedRole="manager">
              <ManagerRequests />
            </RoleRoute>
          </PrivateRoute>
        )}
      />
      <Route
        path="/manager/leave-types"
        element={(
          <PrivateRoute>
            <RoleRoute allowedRole="manager">
              <ManageLeaveTypes />
            </RoleRoute>
          </PrivateRoute>
        )}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
