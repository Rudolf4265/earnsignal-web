import { Badge } from "./Badge";

type TruthNoticeProps = {
  notice: {
    label: string;
    body: string;
    tone: "good" | "warn" | "neutral";
  };
  testId?: string;
};

export function TruthNotice({ notice, testId }: TruthNoticeProps) {
  const toneClassName =
    notice.tone === "warn"
      ? "border-amber-300/40 bg-amber-500/[0.08]"
      : notice.tone === "good"
        ? "border-emerald-300/35 bg-emerald-500/[0.08]"
        : "border-brand-border-strong/70 bg-brand-panel/72";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`} data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={notice.tone}>{notice.label}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{notice.body}</p>
    </div>
  );
}
