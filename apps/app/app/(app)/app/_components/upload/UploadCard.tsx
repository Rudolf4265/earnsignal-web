import type { ReactNode } from "react";

type UploadCardProps = {
  children: ReactNode;
  className?: string;
};

export default function UploadCard({ children, className }: UploadCardProps) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className ?? ""}`}>{children}</section>;
}
