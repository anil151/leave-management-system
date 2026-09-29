// oxlint-disable react(set-state-in-effect)
import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import {
  createLeaveType,
  deleteLeaveType,
  getManagedLeaveTypes,
  getManagerApiError,
  updateLeaveType,
} from '../services/managerApi';

const initialForm = { name: '', description: '', defaultDaysPerYear: '' };

const ManageLeaveTypes = () => {
  const [result, setResult] = useState({ data: [], page: 1, totalPages: 0, total: 0 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTypes = async (page = 1) => {
    try {
      setResult(await getManagedLeaveTypes({ page }));
    } catch (requestError) {
      setError(getManagerApiError(requestError, 'Unable to load leave types.'));
    } finally {
      // Loading must end when the async request settles.
      // oxlint-disable-next-line react(set-state-in-effect)
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setError('');
    setSuccess('');
  };

  const editType = (leaveType) => {
    setEditingId(leaveType._id);
    setForm({ name: leaveType.name, description: leaveType.description || '', defaultDaysPerYear: leaveType.defaultDaysPerYear });
    setSuccess('');
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || form.defaultDaysPerYear === '') {
      setError('Name and default days per year are required.');
      return;
    }

    if (Number(form.defaultDaysPerYear) < 0 || Number.isNaN(Number(form.defaultDaysPerYear))) {
      setError('Default days per year must be a number of at least 0.');
      return;
    }

    setSaving(true);
    const payload = { ...form, name: form.name.trim(), defaultDaysPerYear: Number(form.defaultDaysPerYear) };
    try {
      if (editingId) {
        await updateLeaveType(editingId, payload);
        setSuccess('Leave type updated.');
      } else {
        await createLeaveType(payload);
        setSuccess('Leave type created.');
      }
      resetForm();
      await loadTypes(editingId ? result.page : 1);
    } catch (requestError) {
      setError(getManagerApiError(requestError, 'Unable to save this leave type.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (leaveType) => {
    if (!window.confirm(`Delete ${leaveType.name}?`)) return;

    setDeletingId(leaveType._id);
    setError('');
    try {
      await deleteLeaveType(leaveType._id);
      setSuccess('Leave type deleted.');
      await loadTypes(result.page);
    } catch (requestError) {
      setError(getManagerApiError(requestError, 'Unable to delete this leave type.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <main className="employee-page manager-page">
        <section className="page-heading manager-heading">
          <div>
            <p className="eyebrow manager-eyebrow">Manager / configuration</p>
            <h1>Leave types</h1>
            <p className="muted">Set the annual allowances your team can request.</p>
          </div>
          <span className="manager-mark">MANAGER</span>
        </section>
        <section className="manager-form-panel">
          <div>
            <p className="eyebrow">{editingId ? 'Edit leave type' : 'New leave type'}</p>
            <h2>{editingId ? 'Update allowance' : 'Create an allowance'}</h2>
          </div>
          <form className="manager-form" onSubmit={handleSubmit}>
            <label>Name<input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wellness" /></label>
            <label>Days per year<input name="defaultDaysPerYear" type="number" min="0" value={form.defaultDaysPerYear} onChange={handleChange} placeholder="12" /></label>
            <label className="description-field">Description <span className="optional">Optional</span><input name="description" value={form.description} onChange={handleChange} placeholder="Short description" /></label>
            <div className="manager-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create leave type'}</button>{editingId && <button className="cancel-button" type="button" onClick={resetForm}>Cancel</button>}</div>
          </form>
          {error && <div className="form-error" role="alert">{error}</div>}
          {success && <div className="form-success" role="status">{success}</div>}
        </section>
        {loading && <LoadingState label="Loading leave types..." />}
        {!loading && !error && result.data.length === 0 && <div className="empty-state">No leave types have been configured.</div>}
        {!loading && result.data.length > 0 && (
          <section className="request-table-wrap manager-table-wrap">
            <table className="request-table manager-table type-table">
              <thead><tr><th>Name</th><th>Description</th><th>Days per year</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {result.data.map((leaveType) => (
                  <tr key={leaveType._id}><td><strong>{leaveType.name}</strong></td><td>{leaveType.description || 'No description'}</td><td>{leaveType.defaultDaysPerYear}</td><td className="action-cell"><div className="action-buttons"><button type="button" className="approve-button" onClick={() => editType(leaveType)}>Edit</button><button type="button" className="reject-button" onClick={() => handleDelete(leaveType)} disabled={deletingId === leaveType._id}>{deletingId === leaveType._id ? 'Deleting...' : 'Delete'}</button></div></td></tr>
                ))}
              </tbody>
            </table>
            <Pagination page={result.page} totalPages={result.totalPages} onPageChange={loadTypes} />
          </section>
        )}
      </main>
    </AppShell>
  );
};

export default ManageLeaveTypes;
