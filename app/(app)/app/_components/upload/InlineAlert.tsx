import type { HTMLAttributes, ReactNode } from "react";

type InlineAlertProps = HTMLAttributes<HTMLDivElement> & {
  variant: "error" | "warn" | "success" | "info";
  title?: string;
  children?: ReactNode;
};

const styles: Record<InlineAlertProps["variant"], string> = {
  error: "border-red-500/20 bg-red-500/10 text-red-100",
  warn: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  success: "border-green-500/20 bg-green-500/10 text-green-100",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-100",
};

export default function InlineAlert({ variant, title, children, className, ...rest }: InlineAlertProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles[variant]} ${className ?? ""}`.trim()} {...rest}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {children ? <div className="mt-1 text-sm text-current/90">{children}</div> : null}
    </div>
  );
}
