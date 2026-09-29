import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import LoadingState from '../components/LoadingState';
import { createLeaveRequest, getApiErrorMessage, getLeaveTypes } from '../services/leaveApi';

const initialForm = { leaveType: '', startDate: '', endDate: '', reason: '' };

const ApplyLeave = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getLeaveTypes()
      .then(setLeaveTypes)
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load leave types.')))
      .finally(() => setLoadingTypes(false));
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setError('');
    setSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.leaveType || !form.startDate || !form.endDate) {
      setError('Leave type, start date, and end date are required.');
      return;
    }

    if (form.endDate < form.startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const createdRequest = await createLeaveRequest(form);
      setSuccess(createdRequest);
      setForm(initialForm);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to submit your leave request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <main className="employee-page narrow-page">
        <section className="page-heading">
          <div>
            <p className="eyebrow">New request</p>
            <h1>Plan your time away.</h1>
            <p className="muted">Choose your dates and give your manager the context they need.</p>
          </div>
          <Link className="quiet-link" to="/requests">View my requests</Link>
        </section>
        <section className="form-panel">
          {loadingTypes ? <LoadingState label="Loading leave types..." /> : (
            <form className="leave-form" onSubmit={handleSubmit}>
              {error && <div className="form-error" role="alert">{error}</div>}
              {success && (
                <div className="form-success" role="status">
                  Request submitted for <strong>{success.daysRequested} day{success.daysRequested === 1 ? '' : 's'}</strong>.
                </div>
              )}
              {leaveTypes.length === 0 ? (
                <div className="empty-state">No leave types are available yet.</div>
              ) : (
                <>
                  <label>
                    Leave type
                    <select name="leaveType" value={form.leaveType} onChange={handleChange}>
                      <option value="">Select a leave type</option>
                      {leaveTypes.map((leaveType) => <option key={leaveType._id} value={leaveType._id}>{leaveType.name}</option>)}
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      Start date
                      <input name="startDate" type="date" min={today} value={form.startDate} onChange={handleChange} />
                    </label>
                    <label>
                      End date
                      <input name="endDate" type="date" min={form.startDate || today} value={form.endDate} onChange={handleChange} />
                    </label>
                  </div>
                  <label>
                    Reason <span className="optional">Optional</span>
                    <textarea name="reason" rows="5" value={form.reason} onChange={handleChange} placeholder="Add a short note for your manager" />
                  </label>
                  <button type="submit" disabled={submitting}>{submitting ? 'Submitting request...' : 'Submit request'}</button>
                </>
              )}
            </form>
          )}
        </section>
      </main>
    </AppShell>
  );
};

export default ApplyLeave;
