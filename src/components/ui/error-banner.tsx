"use client";

import type { HTMLAttributes, ReactNode } from "react";

type ErrorBannerProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
  requestId?: string;
};

export function ErrorBanner({
  title = "Something went wrong",
  message,
  retryLabel = "Retry",
  onRetry,
  action,
  className = "",
  children,
  requestId,
  ...rest
}: ErrorBannerProps) {
  return (
    <div
      className={`rounded-xl border border-rose-300/30 bg-rose-500/10 p-4 text-rose-100 ${className}`}
      role="alert"
      {...rest}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-rose-100/90">{message}</p>
      {children ? <div className="mt-2">{children}</div> : null}
      {requestId ? <p className="mt-2 text-xs text-rose-100/80" data-testid="error-request-id">Request ID: {requestId}</p> : null}
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
