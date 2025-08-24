import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-lg p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong!</h2>
            <p className="text-red-600 mb-4">
              The application encountered an unexpected error. Please refresh the page or try again.
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Error Details (Click to expand)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                <p><strong>Error:</strong> {this.state.error?.message}</p>
                <p><strong>Stack:</strong></p>
                <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
                {this.state.errorInfo && (
                  <>
                    <p><strong>Component Stack:</strong></p>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;