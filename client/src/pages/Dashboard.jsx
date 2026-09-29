import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import LoadingState from '../components/LoadingState';
import { getApiErrorMessage, getLeaveBalance } from '../services/leaveApi';

const Dashboard = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getLeaveBalance()
      .then((data) => {
        if (active) setBalances(data);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Unable to load your leave balance.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <main className="employee-page">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Employee dashboard</p>
            <h1>Your leave balance</h1>
            <p className="muted">A quick view of the days you can still plan this year.</p>
          </div>
          <div className="heading-note">{new Date().getFullYear()} allowance</div>
        </section>
        {loading && <LoadingState label="Loading balance..." />}
        {error && <div className="form-error" role="alert">{error}</div>}
        {!loading && !error && balances.length === 0 && (
          <div className="empty-state">No leave types are configured yet.</div>
        )}
        {!loading && !error && balances.length > 0 && (
          <section className="balance-grid" aria-label="Leave balances">
            {balances.map(({ leaveType, daysRemaining, defaultDaysPerYear, daysUsed }) => (
              <article className="balance-card" key={leaveType._id}>
                <div className="balance-card-topline">
                  <span className="balance-icon" aria-hidden="true">{leaveType.name.slice(0, 1)}</span>
                  <span className="muted">{daysUsed} used</span>
                </div>
                <h2>{leaveType.name}</h2>
                <div className="balance-number">
                  <strong>{daysRemaining}</strong>
                  <span>/ {defaultDaysPerYear} days</span>
                </div>
                <div className="balance-track" aria-label={`${daysRemaining} of ${defaultDaysPerYear} days remaining`}>
                  <span style={{ width: `${defaultDaysPerYear ? Math.min((daysRemaining / defaultDaysPerYear) * 100, 100) : 0}%` }} />
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  );
};

export default Dashboard;
