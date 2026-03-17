import Image from "next/image";
import { BRAND_NAME, brandLogo } from "@earnsigma/brand";
import { cn } from "../lib/cn";

export type LogoProps = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
  priority?: boolean;
  variant?: "mark" | "lockup";
};

export function Logo({
  className,
  iconClassName,
  labelClassName,
  showLabel = true,
  priority = false,
  variant = "mark",
}: LogoProps) {
  if (variant === "lockup") {
    return (
      <Image
        src={brandLogo.lockupPath}
        alt={BRAND_NAME}
        width={180}
        height={44}
        priority={priority}
        className={iconClassName ?? "h-8 w-auto"}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={brandLogo.markPath}
        alt={BRAND_NAME}
        width={732}
        height={732}
        priority={priority}
        className={iconClassName ?? "h-9 w-9"}
      />
      {showLabel ? <span className={labelClassName ?? "font-semibold"}>{BRAND_NAME}</span> : null}
    </span>
  );
}
