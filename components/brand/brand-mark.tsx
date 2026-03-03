import Image from "next/image";
import { BRAND_NAME } from "@/src/lib/brand";

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
  priority?: boolean;
  variant?: "mark" | "lockup";
};

export function BrandMark({
  className,
  iconClassName,
  labelClassName,
  showLabel = true,
  priority = false,
  variant = "mark",
}: BrandMarkProps) {
  if (variant === "lockup") {
    return (
      <span className={className ?? "inline-flex items-center gap-2.5"}>
        <Image
          src="/brand/earnsigma-mark.svg"
          alt={BRAND_NAME}
          width={32}
          height={32}
          priority={priority}
          className={iconClassName ?? "h-8 w-8"}
        />
        <span className={labelClassName ?? "text-base font-semibold leading-none"}>{BRAND_NAME}</span>
      </span>
    );
  }

  return (
    <span className={className ?? "inline-flex items-center gap-2"}>
      <Image
        src="/brand/earnsigma-mark.svg"
        alt={BRAND_NAME}
        width={36}
        height={36}
        priority={priority}
        className={iconClassName ?? "h-9 w-9"}
      />
      {showLabel ? <span className={labelClassName ?? "font-semibold"}>{BRAND_NAME}</span> : null}
    </span>
  );
}
