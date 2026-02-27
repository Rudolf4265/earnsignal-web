"use client";

type ErrorBannerProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function ErrorBanner({
  title = "Something went wrong",
  message,
  retryLabel = "Retry",
  onRetry,
  action,
  className = "",
  children,
}: ErrorBannerProps) {
  return (
    <div className={`rounded-xl border border-rose-300/30 bg-rose-500/10 p-4 text-rose-100 ${className}`} role="alert">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-rose-100/90">{message}</p>
      {children ? <div className="mt-2">{children}</div> : null}
      {onRetry || action ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs font-medium hover:bg-rose-300/10"
            >
              {retryLabel}
            </button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
