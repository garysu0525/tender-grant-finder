import { CheckCircle2, HelpCircle, XCircle, ArrowRight } from "lucide-react";
import type { MatchResult } from "../types";

function reasonIcon(reason: string) {
  if (reason.startsWith("符合")) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  if (reason.startsWith("不符")) return <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />;
  return <HelpCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
}

interface Props {
  result: MatchResult | null;
  onGoToProfile?: () => void;
}

export function MatchDetail({ result, onGoToProfile }: Props) {
  if (!result) return null;
  const hasGap = result.status !== "pass";

  return (
    <div className="mt-2 space-y-1.5 rounded-md bg-slate-50 border border-slate-200 p-2.5">
      <ul className="space-y-1">
        {result.reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
            {reasonIcon(r)}
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {hasGap && onGoToProfile && (
        <button
          onClick={onGoToProfile}
          className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
        >
          前往公司資料補齊 <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
