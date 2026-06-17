import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MatchResult } from "../types";

export function MatchDetail({ result }: { result: MatchResult | null }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        比對細項（{result.reasons.length}）
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l-2 border-slate-200 pl-3">
          {result.reasons.map((r, i) => (
            <li key={i} className="text-xs text-slate-600">
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
