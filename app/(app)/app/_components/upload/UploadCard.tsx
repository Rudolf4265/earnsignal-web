import type { ReactNode } from "react";

type UploadCardProps = {
  children: ReactNode;
  className?: string;
};

export default function UploadCard({ children, className }: UploadCardProps) {
  return <section className={`rounded-2xl border border-white/10 bg-navy-900 p-6 ${className ?? ""}`}>{children}</section>;
}
