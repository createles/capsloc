import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Copy, Check, ChevronDown } from "lucide-react";
import { useTranslation, type TranslationKey } from "../../i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface InnerProps extends Props {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

class ErrorBoundaryInner extends Component<InnerProps, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Workspace presentation error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleCopyDetails = (): void => {
    const diagnostic = `CAPSLOC ERROR REPORT\nError: ${this.state.error?.name || "Error"}: ${
      this.state.error?.message || "Unknown"
    }\nStack: ${this.state.error?.stack || "N/A"}\nComponent Stack: ${
      this.state.errorInfo?.componentStack || "N/A"
    }`;

    navigator.clipboard.writeText(diagnostic).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = this.props;

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-surface-canvas p-6 font-sans text-slate-100 select-none">
          <div className="w-full max-w-xl rounded-2xl border border-rose-500/30 bg-surface-panel/95 p-6 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3.5 border-b border-white/[0.08] pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">
                  {t("error.title")}
                </h1>
                <p className="text-xs text-slate-400">{t("error.subtitle")}</p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="mb-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-surface-card p-3.5 font-mono text-xs text-rose-300 select-text">
              <div className="mb-1 font-sans text-[11px] font-medium text-slate-400">
                {t("error.details")}
              </div>
              <p className="font-semibold">
                {this.state.error?.name}: {this.state.error?.message || "Runtime exception"}
              </p>
            </div>

            {/* Stack trace detail (collapsible) */}
            {this.state.error?.stack && (
              <details className="group mb-5">
                <summary className="flex cursor-pointer items-center gap-1 font-sans text-xs text-slate-400 transition-colors hover:text-slate-200">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180" />
                  <span>{t("error.viewStackTrace")}</span>
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-400 select-text">
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Hierarchy:"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-surface-hover hover:text-white"
              >
                {this.state.copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t("error.copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("error.copyDetails")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t("error.reload")}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const { t } = useTranslation();
  return (
    <ErrorBoundaryInner t={t} fallback={fallback}>
      {children}
    </ErrorBoundaryInner>
  );
};
