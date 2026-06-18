import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Clock, Landmark, Loader2, Radio } from "lucide-react";
import type { CompanyProfile, Grant, GrantAcceptanceStatus, LiveGrantItem } from "../types";
import { GRANTS } from "../data/grants";
import { evaluateGrantMatch } from "../lib/matchEngine";
import { fetchLiveGrants, daysUntil, LiveGrantsApiError } from "../lib/liveGrantsApi";
import { StatusBadge } from "./StatusBadge";
import { MatchDetail } from "./MatchDetail";

interface Props {
  profile: CompanyProfile;
  hasProfile: boolean;
}

const ACCEPTANCE_STATUS_MAP: Record<GrantAcceptanceStatus, { label: string; cls: string }> = {
  rolling: { label: "全年受理", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  scheduled: { label: "依年度公告", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  loan: { label: "低利貸款非補助", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

function AcceptanceBadge({ status }: { status: GrantAcceptanceStatus }) {
  const m = ACCEPTANCE_STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium shrink-0 ${m.cls}`}>
      <Clock className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function GrantCard({ grant, profile, hasProfile }: { grant: Grant; profile: CompanyProfile; hasProfile: boolean }) {
  const result = evaluateGrantMatch(hasProfile ? profile : null, grant.requirements);
  return (
    <div className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
              {grant.category}
            </span>
            <AcceptanceBadge status={grant.acceptanceStatus} />
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-800 leading-snug">{grant.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Landmark className="h-3 w-3" />
              {grant.agency}
            </span>
            <span>·</span>
            <span>申請對象：{grant.applicantType}</span>
          </div>
        </div>
        <StatusBadge status={result.status} />
      </div>

      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{grant.summary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>補助 {grant.amount}</span>
        <span>·</span>
        <span>申請期間 {grant.deadline}</span>
      </div>

      <MatchDetail result={result} />
      <a
        href={grant.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        官方計畫頁面 <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function LiveGrantCard({ item }: { item: LiveGrantItem }) {
  const remaining = daysUntil(item.endDate);
  return (
    <div className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
              {item.category || "國科會"}
            </span>
            {item.area && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {item.area}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-800 leading-snug">{item.title}</h3>
        </div>
        {remaining != null ? (
          <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 shrink-0">
            <Clock className="h-3 w-3" />
            距截止 {remaining} 天
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
            <Clock className="h-3 w-3" />
            {item.startDate ? "受理中" : "即日起受理"}
          </span>
        )}
      </div>
      {item.highlight && <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{item.highlight}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {item.phase && <span>徵求階段：{item.phase}</span>}
        <span>徵求期間：{item.periodText}</span>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        計畫詳情 <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function LiveGrantsSection() {
  const [items, setItems] = useState<LiveGrantItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveGrants()
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof LiveGrantsApiError ? e.message : "無法取得即時補助公告");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Radio className="h-4 w-4 text-rose-500" />
        即時公告（國科會計畫徵求專區，含真實截止倒數）
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 即時抓取中...
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && items && items.length === 0 && (
        <p className="text-xs text-slate-400">目前沒有抓到開放中的公告。</p>
      )}

      {!loading && !error && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <LiveGrantCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GrantsTab({ profile, hasProfile }: Props) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => ["all", ...new Set(GRANTS.map((g) => g.category))], []);

  const filtered = GRANTS.filter((g) => category === "all" || g.category === category);

  return (
    <div className="space-y-6">
      <LiveGrantsSection />

      <div className="border-t border-slate-200 pt-4 space-y-4">
        <div className="text-sm font-semibold text-slate-700">長期性計畫（彙整自各部會公開資訊）</div>

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
              {c !== "all" && (
                <span className="ml-1 text-slate-400">{GRANTS.filter((g) => g.category === c).length}</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          共 {GRANTS.length} 筆補助計畫，目前顯示 {filtered.length} 筆
        </p>

        {!hasProfile && (
          <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            填寫「公司資料」分頁後，這裡會自動標示每個補助計畫的申請資格符合度。
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((g) => (
            <GrantCard key={g.id} grant={g} profile={profile} hasProfile={hasProfile} />
          ))}
        </div>

        <p className="text-xs text-slate-400">
          補助計畫彙整自各部會公開資訊，實際申請資格與受理期間請以官方公告為準。
        </p>
      </div>
    </div>
  );
}
