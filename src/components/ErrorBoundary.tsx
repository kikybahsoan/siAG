import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm("Apakah Anda ingin mereset cache lokal browser dan memuat ulang? Data di Google Spreadsheet Anda tetap aman.")) {
      try {
        const keepUrl = localStorage.getItem("sup_gsheet_webapp_url");
        localStorage.clear();
        if (keepUrl) {
          localStorage.setItem("sup_gsheet_webapp_url", keepUrl);
        }
      } catch (e) {
        console.warn("Error clearing localStorage:", e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Terjadi Kendala Tampilan
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Aplikasi mengalami kendala teknis saat memuat data. Anda dapat memuat ulang aplikasi atau membersihkan cache memori browser.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 text-left overflow-auto max-h-32 text-[11px] font-mono text-red-400">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Aplikasi</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetData}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-neutral-400" />
                <span>Bersihkan Cache Lokal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
