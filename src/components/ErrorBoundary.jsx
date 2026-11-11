import React from "react";

export class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    console.error(
      "[Portfolio] Render failed in " + this.props.scope,
      error,
      info.componentStack,
    );
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="error-panel" role="alert">
        <h2>Couldn’t open {this.props.scope}</h2>
        <p>
          Try opening it again. If the issue persists, reload the workspace.
        </p>
        <button
          className="secondary"
          onClick={() => this.setState({ failed: false })}
        >
          Try again
        </button>
      </section>
    );
  }
}
