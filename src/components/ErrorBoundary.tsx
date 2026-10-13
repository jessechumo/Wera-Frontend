import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './States';

/**
 * Catches render errors below it and shows what failed instead of an empty
 * page. Without one, any crash unmounts the whole app and leaves only the
 * theme's background color: a blank black (or white) screen.
 *
 * Change `resetKey` (e.g. the route) to clear the error and try again.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey?: string; fullPage?: boolean },
  { error: Error | null; key?: string }
> {
  state: { error: Error | null; key?: string } = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey?: string },
    state: { error: Error | null; key?: string },
  ) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('wera: render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const state = (
      <ErrorState
        message={`This page hit an error: ${error.message || String(error)}`}
        onRetry={() => window.location.reload()}
      />
    );
    return this.props.fullPage ? (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6 text-text">
        <div className="w-full max-w-lg">{state}</div>
      </div>
    ) : (
      state
    );
  }
}
