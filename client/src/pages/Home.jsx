import { Link } from 'react-router-dom';

const Home = () => (
  <main className="leave-home-page">
    <header className="leave-topbar">
      <Link className="leave-home-brand" to="/">Leave<span>flow</span></Link>
      <nav className="leave-nav" aria-label="Main navigation">
        <Link to="/login">Sign in</Link>
        <Link className="leave-nav-cta" to="/register">Get started</Link>
      </nav>
    </header>

    <section className="leave-hero">
      <div className="leave-hero-content">
        <h1>Manage Your Leave Easily</h1>
        <p>Simple and efficient leave management</p>

        <div className="leave-cta-row">
          <Link className="leave-primary-btn" to="/register">Get started</Link>
          <Link className="leave-secondary-btn" to="/login">Sign in</Link>
        </div>
      </div>
    </section>

    <section className="leave-services" aria-label="Services">
      <h2>SERVICES</h2>

      <div className="leave-service-grid">
        <article className="leave-service-card">
          <div className="card-icon">✦</div>
          <h3>Apply Leave</h3>
          <p>Submit your request with dates and reason.</p>
        </article>

        <article className="leave-service-card">
          <div className="card-icon">◎</div>
          <h3>Leave Balance</h3>
          <p>Track your available leave days and usage.</p>
        </article>

        <article className="leave-service-card">
          <div className="card-icon">▣</div>
          <h3>My Requests</h3>
          <p>Monitor request status and manage pending items.</p>
        </article>

        <article className="leave-service-card">
          <div className="card-icon">✓</div>
          <h3>Manager</h3>
          <p>Review requests and approve with confidence.</p>
        </article>
      </div>
    </section>
  </main>
);

export default Home;
