import { Link } from 'react-router-dom';

const NotAuthorized = () => (
  <main className="simple-page">
    <p className="eyebrow">Access limited</p>
    <h1>You do not have permission to view this page.</h1>
    <p className="muted">Return to your workspace and continue with the tools available to your role.</p>
    <Link className="button-link" to="/">Back to workspace</Link>
  </main>
);

export default NotAuthorized;
