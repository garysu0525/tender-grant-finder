import { useMemo, useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import type { CompanyProfile } from "../types";
import { GRANTS } from "../data/grants";
import { evaluateGrantMatch } from "../lib/matchEngine";
import { StatusBadge } from "./StatusBadge";
import { MatchDetail } from "./MatchDetail";

interface Props {
  profile: CompanyProfile;
  hasProfile: boolean;
}

export function GrantsTab({ profile, hasProfile }: Props) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => ["all", ...new Set(GRANTS.map((g) => g.category))], []);

  const filtered = GRANTS.filter((g) => category === "all" || g.category === category);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? "border-slate-700 bg-slate-700 text-white"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {c === "all" ? "全部" : c}
          </button>
        ))}
      </div>

      {!hasProfile && (
        <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          填寫「公司資料」分頁後，這裡會自動標示每個補助計畫的申請資格符合度。
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((g) => {
          const result = evaluateGrantMatch(hasProfile ? profile : null, g.requirements);
          return (
            <div
              key={g.id}
              className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {g.category}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-slate-800 leading-snug">{g.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{g.agency}</span>
                    <span>·</span>
                    <span>補助 {g.amount}</span>
                    <span>·</span>
                    <span>申請期間 {g.deadline}</span>
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </div>
              <MatchDetail result={result} />
              <a
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                官方計畫頁面 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        補助計畫彙整自各部會公開資訊，實際申請資格與受理期間請以官方公告為準。
      </p>
    </div>
  );
}
