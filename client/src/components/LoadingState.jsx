const LoadingState = ({ label = 'Loading...' }) => (
  <div className="loading-state" role="status">
    <span className="loading-dot" aria-hidden="true" />
    {label}
  </div>
);

export default LoadingState;
