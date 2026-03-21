import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let errorDetails = "";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error === "Missing or insufficient permissions.") {
            errorMessage = "Access Denied: You do not have permission to access this data.";
            errorDetails = "Please ensure you are logged in with the correct account and have the necessary permissions.";
          } else {
            errorMessage = parsed.error || errorMessage;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-jarvis-bg flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full border border-red-900/50 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500 flex items-center justify-center mb-4">
                <span className="text-red-500 text-2xl font-bold">!</span>
              </div>
              <h1 className="text-xl font-mono font-bold text-red-400 mb-2 uppercase tracking-widest">System Error</h1>
              <p className="text-sm font-mono text-red-300/70 mb-4">{errorMessage}</p>
              {errorDetails && <p className="text-xs font-mono text-red-300/50 mb-6">{errorDetails}</p>}
              <button
                className="px-6 py-2 bg-red-950/50 border border-red-500 text-red-400 text-sm font-mono uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                onClick={() => window.location.reload()}
              >
                Reboot System
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
