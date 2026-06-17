import { useCallback, useState } from "react";
import {
  Search,
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import type { TenderDetailInfo, TenderListItem } from "../types";
import { fetchTenderDetail, PccApiError, searchTenders } from "../lib/pccApi";

function TenderQualificationPanel({ detail }: { detail: TenderDetailInfo }) {
  const { qualification } = detail;
  return (
    <div className="mt-3 space-y-2 rounded-md bg-slate-50 border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        {detail.budgetAmount && <span>預算金額：{detail.budgetAmount}</span>}
        {detail.deadline && <span>截止投標：{detail.deadline}</span>}
        {detail.bidOpenDate && <span>開標時間：{detail.bidOpenDate}</span>}
      </div>

      <div className="flex items-start gap-1.5 text-xs text-amber-700">
        <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span className="font-medium">待確認 — 公文用語多變，以下為關鍵字規則自動解析，請務必對照原始公告</span>
      </div>

      {qualification.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {qualification.flags.map((f) => (
            <span
              key={f.type}
              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
            >
              ⚠ {f.label}
            </span>
          ))}
        </div>
      )}

      {qualification.industryCodes.length > 0 && (
        <p className="text-xs text-slate-600">
          偵測到行業代碼限制：{qualification.industryCodes.join("、")}
        </p>
      )}

      {qualification.hasExtraRequirement ? (
        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
          {qualification.cleanedSummary}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          僅需公司合法登記（具公司登記或商業登記），未偵測到其他特別資格限制。
        </p>
      )}
    </div>
  );
}

function TenderCard({ tender }: { tender: TenderListItem }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<TenderDetailInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    setExpanded((e) => !e);
    if (!detail && !loading) {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchTenderDetail(tender.unitId, tender.jobNumber);
        setDetail(d);
      } catch (e) {
        setError(e instanceof PccApiError ? e.message : "查詢資格資訊失敗");
      } finally {
        setLoading(false);
      }
    }
  }, [detail, loading, tender.unitId, tender.jobNumber]);

  return (
    <div className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{tender.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{tender.unitName}</span>
            {tender.category && (
              <>
                <span>·</span>
                <span>{tender.category}</span>
              </>
            )}
            <span>·</span>
            <span>公告日 {tender.date}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {loading ? "查詢資格資訊中..." : "展開資格與金額資訊"}
        </button>
        <a
          href={tender.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          查看原始公告 <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {expanded && loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 查詢中...
        </div>
      )}

      {expanded && error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {expanded && !loading && !error && detail && <TenderQualificationPanel detail={detail} />}
    </div>
  );
}

export function TendersTab({ hasProfile }: { hasProfile: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TenderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const runSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchTenders(query.trim(), 1);
      setResults(res.items);
      setTotalRecords(res.totalRecords);
    } catch (e) {
      setError(e instanceof PccApiError ? e.message : "查詢失敗，請稍後再試");
      setResults([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="輸入標案關鍵字，例如：資訊系統、雲端、行銷"
            className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <button
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          查詢
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!hasProfile && searched && (
        <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          標案的廠商資格條件多為公文自由文字，本工具僅以關鍵字規則協助標示重點，無法做到自動「符合/不符」判斷，請務必對照原始公告。
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <p className="text-xs text-slate-400">
          共 {totalRecords.toLocaleString()} 筆符合，僅顯示前 {results.length} 筆
        </p>
      )}

      <div className="space-y-3">
        {results.map((t) => (
          <TenderCard key={t.id} tender={t} />
        ))}

        {searched && !loading && !error && results.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            查無符合「{query}」的標案，換個關鍵字試試。
          </div>
        )}

        {!searched && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            輸入關鍵字開始查詢全國政府標案
          </div>
        )}
      </div>
    </div>
  );
}
