import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Client rendering error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="simple-page">
          <p className="eyebrow">Something went wrong</p>
          <h1>This page needs a fresh start.</h1>
          <p className="muted">Reload the application and try again.</p>
          <button className="button-link" type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
