import React from "react";

/**
 * ErrorBoundary
 * ─────────────
 * Catches runtime errors in the component tree and shows a
 * friendly fallback UI instead of a blank screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__icon">⚠</div>
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__msg">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="btn btn--ghost"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
