import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const getErrorMessage = (error) => {
  const validationErrors = error.response?.data?.errors;
  if (validationErrors) return Object.values(validationErrors).join(' ');
  if (!error.response) return 'API is unavailable. Start the server on port 5000 and try again.';
  return error.response?.data?.message || 'Unable to create your account. Please try again.';
};

const Register = () => {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
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

    if (!form.name.trim() || !form.email || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ ...form, name: form.name.trim() });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <p className="eyebrow">Start with clarity</p>
        <h1>Build a healthier rhythm around leave.</h1>
        <p>Set up your account and keep every request in view.</p>
      </section>
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Get started</p>
          <h2>Create account</h2>
          <p className="muted">Your role controls which tools you can access.</p>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
        </label>
        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button>
        <p className="form-footer">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </main>
  );
};

export default Register;
