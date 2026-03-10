import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonClassName({
  variant = "secondary",
  size = "md",
  className,
}: ButtonClassOptions = {}): string {
  const base =
    "inline-flex items-center justify-center rounded-xl border font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue/70 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClass: Record<ButtonVariant, string> = {
    primary:
      "border-brand-accent-blue bg-brand-accent-blue text-white shadow-brand-glow hover:border-brand-accent-blue-strong hover:bg-brand-accent-blue-strong",
    secondary:
      "border-brand-border bg-brand-panel-muted/80 text-brand-text-primary hover:border-brand-border-strong hover:bg-brand-panel-muted",
    ghost: "border-transparent bg-transparent text-brand-text-secondary hover:bg-brand-panel-muted hover:text-brand-text-primary",
  };

  const sizeClass: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return cn(base, variantClass[variant], sizeClass[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, size, className })} {...props} />;
}
