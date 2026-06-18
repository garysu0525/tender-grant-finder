import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  HelpCircle,
  Landmark,
  Loader2,
  Radio,
  Search,
  XCircle,
} from "lucide-react";
import type { CompanyProfile, Grant, GrantAcceptanceStatus, LiveGrantItem, MatchStatus, TrackedItem } from "../types";
import { GRANTS } from "../data/grants";
import { evaluateGrantMatch } from "../lib/matchEngine";
import { fetchLiveGrants, daysUntil, LiveGrantsApiError } from "../lib/liveGrantsApi";
import { StatusBadge } from "./StatusBadge";
import { MatchDetail } from "./MatchDetail";

type ToggleTracked = (item: Omit<TrackedItem, "status" | "addedAt">) => void;

interface Props {
  profile: CompanyProfile;
  hasProfile: boolean;
  onGoToProfile: () => void;
  tracked: TrackedItem[];
  onToggleTracked: ToggleTracked;
}

function TrackButton({ tracked, onClick }: { tracked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 transition-colors ${
        tracked
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-slate-300 text-slate-500 hover:border-slate-400"
      }`}
    >
      {tracked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {tracked ? "已追蹤" : "加入追蹤"}
    </button>
  );
}

const ACCEPTANCE_STATUS_MAP: Record<GrantAcceptanceStatus, { label: string; cls: string }> = {
  rolling: { label: "全年受理", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  scheduled: { label: "依年度公告", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  loan: { label: "低利貸款非補助", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  investment: { label: "股權投資非補助", cls: "bg-violet-50 text-violet-700 border-violet-200" },
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

function GrantCard({
  grant,
  profile,
  hasProfile,
  onGoToProfile,
  isTracked,
  onToggleTracked,
}: {
  grant: Grant;
  profile: CompanyProfile;
  hasProfile: boolean;
  onGoToProfile: () => void;
  isTracked: boolean;
  onToggleTracked: ToggleTracked;
}) {
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
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={result.status} />
          <TrackButton
            tracked={isTracked}
            onClick={() =>
              onToggleTracked({
                id: grant.id,
                kind: "static-grant",
                name: grant.name,
                agency: grant.agency,
                url: grant.url,
                deadlineText: grant.deadline,
              })
            }
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{grant.summary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>補助 {grant.amount}</span>
        <span>·</span>
        <span>申請期間 {grant.deadline}</span>
      </div>

      <MatchDetail result={result} onGoToProfile={onGoToProfile} />
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

const SOURCE_LABEL: Record<LiveGrantItem["source"], string> = {
  nstc: "國科會",
  moc: "文化部",
};

function LiveGrantCard({
  item,
  isTracked,
  onToggleTracked,
}: {
  item: LiveGrantItem;
  isTracked: boolean;
  onToggleTracked: ToggleTracked;
}) {
  const remaining = daysUntil(item.endDate);
  return (
    <div className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
              {SOURCE_LABEL[item.source]}
            </span>
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
              {item.category || "未分類"}
            </span>
            {item.area && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {item.area}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-800 leading-snug">{item.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {remaining != null ? (
            <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
              <Clock className="h-3 w-3" />
              距截止 {remaining} 天
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <Clock className="h-3 w-3" />
              {item.startDate ? "受理中" : "即日起受理"}
            </span>
          )}
          <TrackButton
            tracked={isTracked}
            onClick={() =>
              onToggleTracked({
                id: item.id,
                kind: "live-grant",
                name: item.title,
                agency: item.category || SOURCE_LABEL[item.source],
                url: item.url,
                deadlineText: item.periodText,
              })
            }
          />
        </div>
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

const LIVE_PAGE_SIZE = 10;

function matchesQuery(haystacks: (string | undefined)[], query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return haystacks.some((h) => h?.toLowerCase().includes(q));
}

function LiveGrantsSection({
  query,
  trackedIds,
  onToggleTracked,
}: {
  query: string;
  trackedIds: Set<string>;
  onToggleTracked: ToggleTracked;
}) {
  const [items, setItems] = useState<LiveGrantItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | LiveGrantItem["source"]>("all");
  const [visibleCount, setVisibleCount] = useState(LIVE_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(LIVE_PAGE_SIZE);
  }, [query]);

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

  const filtered = (items || [])
    .filter((i) => sourceFilter === "all" || i.source === sourceFilter)
    .filter((i) => matchesQuery([i.title, i.category, i.area], query));
  const visible = filtered.slice(0, visibleCount);
  const nstcCount = (items || []).filter((i) => i.source === "nstc").length;
  const mocCount = (items || []).filter((i) => i.source === "moc").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Radio className="h-4 w-4 text-rose-500" />
        即時公告（國科會＋文化部，含真實截止倒數）
      </div>

      {!loading && !error && items && (
        <div className="flex flex-wrap gap-2">
          {(["all", "nstc", "moc"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSourceFilter(s);
                setVisibleCount(LIVE_PAGE_SIZE);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                sourceFilter === s
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              {s === "all" ? `全部 ${items.length}` : s === "nstc" ? `國科會 ${nstcCount}` : `文化部 ${mocCount}`}
            </button>
          ))}
        </div>
      )}

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

      {!loading && !error && items && filtered.length === 0 && (
        <p className="text-xs text-slate-400">目前沒有抓到開放中的公告。</p>
      )}

      {!loading && !error && items && filtered.length > 0 && (
        <>
          <div className="space-y-3">
            {visible.map((item) => (
              <LiveGrantCard
                key={item.id}
                item={item}
                isTracked={trackedIds.has(item.id)}
                onToggleTracked={onToggleTracked}
              />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + LIVE_PAGE_SIZE)}
              className="w-full rounded-md border border-slate-200 py-2 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700"
            >
              顯示更多（{filtered.length - visibleCount} 筆）
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function GrantsTab({ profile, hasProfile, onGoToProfile, tracked, onToggleTracked }: Props) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | null>(null);
  const categories = useMemo(() => ["all", ...new Set(GRANTS.map((g) => g.category))], []);
  const trackedIds = useMemo(() => new Set(tracked.map((t) => t.id)), [tracked]);

  const filtered = GRANTS.filter((g) => category === "all" || g.category === category)
    .filter((g) => matchesQuery([g.name, g.agency, g.category, g.summary], query))
    .filter((g) => {
      if (!statusFilter || !hasProfile) return true;
      return evaluateGrantMatch(profile, g.requirements).status === statusFilter;
    });

  const matchSummary = useMemo(() => {
    if (!hasProfile) return null;
    let pass = 0;
    let unknown = 0;
    let fail = 0;
    for (const g of GRANTS) {
      const status = evaluateGrantMatch(profile, g.requirements).status;
      if (status === "pass") pass++;
      else if (status === "fail") fail++;
      else unknown++;
    }
    return { pass, unknown, fail };
  }, [hasProfile, profile]);

  const staticListRef = useRef<HTMLDivElement>(null);

  const toggleStatusFilter = (status: MatchStatus) => {
    setStatusFilter((s) => (s === status ? null : status));
    requestAnimationFrame(() => {
      staticListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800">補助查詢</h2>
        <p className="mt-1 text-xs text-slate-500">
          常見全國型補助計畫可即時比對資格；另彙整文化部、國科會等「開放申請中」即時公告。
        </p>
      </div>

      {!hasProfile && (
        <button
          onClick={onGoToProfile}
          className="flex w-full items-center justify-between rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 text-left text-xs text-sky-800 hover:border-sky-300"
        >
          <span>建立公司資料後，可自動比對每項補助的申請資格。</span>
          <span className="inline-flex items-center gap-1 font-medium shrink-0">
            前往建立 <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      )}

      {hasProfile && matchSummary && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">
              已套用「{profile.companyName || "您的公司"}」資料比對 {GRANTS.length} 筆長期性計畫：
            </span>
            <button
              onClick={() => toggleStatusFilter("pass")}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                statusFilter === "pass" ? "bg-emerald-600 text-white" : "hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              符合 {matchSummary.pass}
            </button>
            <button
              onClick={() => toggleStatusFilter("unknown")}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                statusFilter === "unknown" ? "bg-amber-600 text-white" : "hover:bg-amber-100"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              待確認 {matchSummary.unknown}
            </button>
            <button
              onClick={() => toggleStatusFilter("fail")}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                statusFilter === "fail" ? "bg-rose-600 text-white" : "hover:bg-rose-100"
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              不符 {matchSummary.fail}
            </button>
          </div>
          <button onClick={onGoToProfile} className="inline-flex items-center gap-1 font-medium hover:underline">
            編輯公司資料 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋補助計畫名稱、機關、類別，例如「研發」「數位」「文化」"
          className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <LiveGrantsSection query={query} trackedIds={trackedIds} onToggleTracked={onToggleTracked} />

      <div ref={staticListRef} className="border-t border-slate-200 pt-4 space-y-4 scroll-mt-4">
        <div className="text-sm font-semibold text-slate-700">長期性計畫（彙整自各部會公開資訊）</div>

        {statusFilter && (
          <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-700">
            <span>
              篩選中：只顯示「
              {statusFilter === "pass" ? "符合" : statusFilter === "unknown" ? "待確認" : "不符"}
              」的補助計畫
            </span>
            <button onClick={() => setStatusFilter(null)} className="font-medium text-slate-500 hover:text-slate-800">
              清除篩選
            </button>
          </div>
        )}

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

        <div className="space-y-3">
          {filtered.map((g) => (
            <GrantCard
              key={g.id}
              grant={g}
              profile={profile}
              hasProfile={hasProfile}
              onGoToProfile={onGoToProfile}
              isTracked={trackedIds.has(g.id)}
              onToggleTracked={onToggleTracked}
            />
          ))}
        </div>

        <p className="text-xs text-slate-400">
          補助計畫彙整自各部會公開資訊，實際申請資格與受理期間請以官方公告為準。
        </p>
      </div>
    </div>
  );
}
