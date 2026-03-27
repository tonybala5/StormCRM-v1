import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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
      let errorMessage = "Ocorreu um erro inesperado.";
      let errorDetails = "";

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Erro no Firestore (${parsed.operationType}): ${parsed.error}`;
            errorDetails = JSON.stringify(parsed, null, 2);
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-bg-secondary border border-border rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-storm-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-storm-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">Ops! Algo deu errado.</h1>
            <p className="text-text-secondary mb-6">{errorMessage}</p>
            
            {errorDetails && (
              <div className="mb-6 p-4 bg-black/20 rounded-lg text-left overflow-auto max-h-60">
                <pre className="text-xs text-storm-red font-mono">{errorDetails}</pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg font-bold transition-colors"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => (this as any).setState({ hasError: false, error: null })}
                className="px-6 py-2 bg-bg-primary hover:bg-border text-text-primary border border-border rounded-lg font-bold transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
