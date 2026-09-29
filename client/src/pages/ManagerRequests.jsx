// oxlint-disable react(set-state-in-effect)
import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import {
  approveLeaveRequest,
  getManagedLeaveRequests,
  getManagerApiError,
  rejectLeaveRequest,
} from '../services/managerApi';

const formatDate = (value) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

const ManagerRequests = () => {
  const [result, setResult] = useState({ data: [], page: 1, totalPages: 0, total: 0 });
  const [status, setStatus] = useState('pending');
  const [employee, setEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const loadRequests = async (page = 1, selectedStatus = status, selectedEmployee = employee) => {
    try {
      setResult(await getManagedLeaveRequests({ page, status: selectedStatus, employee: selectedEmployee.trim() }));
    } catch (requestError) {
      setError(getManagerApiError(requestError, 'Unable to load leave requests.'));
    } finally {
      // Loading must end when the async request settles.
      // oxlint-disable-next-line react(set-state-in-effect)
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    loadRequests(1, 'pending', '');
  }, []);

  const handleStatusChange = ({ target }) => {
    setError('');
    setLoading(true);
    setStatus(target.value);
    loadRequests(1, target.value, employee);
  };

  const applyEmployeeFilter = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    loadRequests(1, status, employee);
  };

  const handleAction = async (request, action) => {
    setActionId(request._id);
    setError('');
    try {
      if (action === 'approve') {
        await approveLeaveRequest(request._id);
      } else {
        const reason = window.prompt('Optional rejection reason:') || '';
        await rejectLeaveRequest(request._id, reason.trim());
      }
      await loadRequests(result.page, status, employee);
    } catch (requestError) {
      setError(getManagerApiError(requestError, 'Unable to update this leave request.'));
    } finally {
      setActionId(null);
    }
  };

  const handlePageChange = (page) => {
    setLoading(true);
    loadRequests(page, status, employee);
  };

  return (
    <AppShell>
      <main className="employee-page manager-page">
        <section className="page-heading manager-heading">
          <div>
            <p className="eyebrow manager-eyebrow">Manager / review queue</p>
            <h1>Leave requests</h1>
            <p className="muted">Review employee plans, then approve or send them back with context.</p>
          </div>
          <span className="manager-mark">MANAGER</span>
        </section>
        <form className="manager-filters" onSubmit={applyEmployeeFilter}>
          <label>
            Status
            <select value={status} onChange={handleStatusChange}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="employee-filter">
            Employee ID
            <input value={employee} onChange={({ target }) => setEmployee(target.value)} placeholder="Optional MongoDB ID" />
          </label>
          <button type="submit">Apply filters</button>
        </form>
        {error && <div className="form-error" role="alert">{error}</div>}
        {loading && <LoadingState label="Loading review queue..." />}
        {!loading && !error && result.data.length === 0 && <div className="empty-state">No leave requests match these filters.</div>}
        {!loading && result.data.length > 0 && (
          <section className="request-table-wrap manager-table-wrap">
            <table className="request-table manager-table">
              <thead>
                <tr><th>Employee</th><th>Leave type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {result.data.map((request) => (
                  <tr key={request._id}>
                    <td><strong>{request.employee?.name || 'Unknown employee'}</strong><span className="table-note">{request.employee?.email}</span></td>
                    <td>{request.leaveType?.name || 'Unknown type'}</td>
                    <td>{formatDate(request.startDate)} - {formatDate(request.endDate)}</td>
                    <td>{request.daysRequested}</td>
                    <td><span className="reason-cell">{request.reason || 'No reason added'}</span></td>
                    <td><StatusBadge status={request.status} /></td>
                    <td className="action-cell">
                      {request.status === 'pending' && (
                        <div className="action-buttons">
                          <button type="button" className="approve-button" onClick={() => handleAction(request, 'approve')} disabled={actionId === request._id}>Approve</button>
                          <button type="button" className="reject-button" onClick={() => handleAction(request, 'reject')} disabled={actionId === request._id}>Reject</button>
                        </div>
                      )}
                    </td>
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

export default ManagerRequests;
