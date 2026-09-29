import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const getErrorMessage = (error) => {
  if (!error.response) return 'API is unavailable. Start the server on port 5000 and try again.';
  return error.response.data?.message || 'Unable to sign in. Please try again.';
};

const Login = () => {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <p className="eyebrow">Leave management system</p>
        <h1>Make time off easier to manage.</h1>
        <p>One clear place for leave requests, approvals, and balances.</p>
      </section>
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <p className="muted">Use your work account to continue.</p>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
        <p className="form-footer">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
};

export default Login;
