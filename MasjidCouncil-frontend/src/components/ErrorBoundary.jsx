import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Catches a render or effect crash in one subtree.
 *
 * React unmounts the whole application when an error reaches the root, which is what turns a
 * single broken component into a blank white page with no way back. Wrapping the risky part
 * — the TipTap editor, which owns a lot of state outside React — keeps the crash local: the
 * rest of the screen, including everything typed elsewhere on the page, stays put.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-red-500" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-semibold text-red-800">
          {this.props.title || 'Something went wrong here'}
        </p>
        <p className="mt-1 text-xs text-red-700">{this.state.error.message}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
