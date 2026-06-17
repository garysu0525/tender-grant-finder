import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { MatchStatus } from "../types";

const MAP: Record<MatchStatus, { icon: typeof CheckCircle2; text: string; cls: string }> = {
  pass: { icon: CheckCircle2, text: "符合", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fail: { icon: XCircle, text: "不符", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  unknown: { icon: HelpCircle, text: "待確認", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  const m = MAP[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium shrink-0 ${m.cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.text}
    </span>
  );
}
