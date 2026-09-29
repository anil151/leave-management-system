// oxlint-disable react(set-state-in-effect)
import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import {
  cancelLeaveRequest,
  getApiErrorMessage,
  getMyLeaveRequests,
} from '../services/leaveApi';

const formatDate = (value) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

const MyLeaveRequests = () => {
  const [result, setResult] = useState({ data: [], page: 1, totalPages: 0, total: 0 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const finishLoading = () => setLoading(false);

  const loadRequests = async (page = 1, selectedStatus = status) => {
    try {
      const data = await getMyLeaveRequests({ page, status: selectedStatus });
      setResult(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load your leave requests.'));
    } finally {
      // Loading must end when the async request settles.
      // oxlint-disable-next-line react(set-state-in-effect)
      setTimeout(finishLoading, 0);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status]);

  const handleStatusChange = ({ target }) => {
    setError('');
    setLoading(true);
    setStatus(target.value);
  };

  const handlePageChange = (page) => {
    setError('');
    setLoading(true);
    loadRequests(page);
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await cancelLeaveRequest(id);
      await loadRequests(result.page);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to cancel this request.'));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AppShell>
      <main className="employee-page">
        <section className="page-heading request-heading">
          <div>
            <p className="eyebrow">Your history</p>
            <h1>My leave requests</h1>
            <p className="muted">Track decisions and keep pending plans up to date.</p>
          </div>
          <label className="filter-control">
            Status
            <select value={status} onChange={handleStatusChange}>
              <option value="">All requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </section>
        {error && <div className="form-error" role="alert">{error}</div>}
        {loading && <LoadingState label="Loading requests..." />}
        {!loading && !error && result.data.length === 0 && (
          <div className="empty-state">
            <h2>No requests here yet.</h2>
            <p className="muted">When you need time away, your request will appear in this list.</p>
          </div>
        )}
        {!loading && result.data.length > 0 && (
          <section className="request-table-wrap">
            <table className="request-table">
              <thead>
                <tr><th>Leave type</th><th>Dates</th><th>Days</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {result.data.map((request) => (
                  <tr key={request._id}>
                    <td><strong>{request.leaveType?.name || 'Unknown type'}</strong><span className="table-note">{request.reason || 'No reason added'}</span></td>
                    <td>{formatDate(request.startDate)} - {formatDate(request.endDate)}</td>
                    <td>{request.daysRequested}</td>
                    <td><StatusBadge status={request.status} /></td>
                    <td className="action-cell">{request.status === 'pending' && <button type="button" className="cancel-button" onClick={() => handleCancel(request._id)} disabled={cancellingId === request._id}>{cancellingId === request._id ? 'Cancelling...' : 'Cancel'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={result.page} totalPages={result.totalPages} onPageChange={handlePageChange} />
          </section>
        )}
      </main>
    </AppShell>
  );
};

export default MyLeaveRequests;
