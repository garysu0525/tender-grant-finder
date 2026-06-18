import { useState } from "react";
import {
  ExternalLink,
  Trash2,
  Bookmark,
  Clock,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Sparkles,
  Loader2,
  Copy,
  Download,
  AlertCircle,
} from "lucide-react";
import type { CompanyProfile, TrackedItem, TrackedStatus } from "../types";
import { daysUntil } from "../lib/liveGrantsApi";
import { buildPrepTimeline } from "../lib/prepTimeline";
import { generateDraft, getSavedAccessCode, saveAccessCode, DraftApiError } from "../lib/draftApi";
import { downloadTextFile } from "../lib/applicationSummary";

interface Props {
  tracked: TrackedItem[];
  profile: CompanyProfile;
  onUpdateStatus: (id: string, status: TrackedStatus) => void;
  onRemove: (id: string) => void;
  onGoToGrants: () => void;
  onToggleChecklistItem: (trackedId: string, checklistId: string) => void;
  onUpdateProjectDescription: (id: string, text: string) => void;
  onUpdateAiDraft: (id: string, text: string) => void;
}

const STATUS_OPTIONS: { value: TrackedStatus; label: string }[] = [
  { value: "interested", label: "打算申請" },
  { value: "preparing", label: "準備中" },
  { value: "submitted", label: "已送出" },
];

const STATUS_CLS: Record<TrackedStatus, string> = {
  interested: "bg-slate-100 text-slate-600",
  preparing: "bg-amber-50 text-amber-700",
  submitted: "bg-emerald-50 text-emerald-700",
};

function CountdownBadge({ endDate }: { endDate: string | null }) {
  if (!endDate) return null;
  const remaining = daysUntil(endDate);
  if (remaining == null) return null;
  const urgent = remaining <= 7;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium shrink-0 ${
        urgent ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <Clock className="h-3 w-3" />
      距截止 {remaining} 天
    </span>
  );
}

function AiDraftSection({
  item,
  profile,
  onUpdateProjectDescription,
  onUpdateAiDraft,
}: {
  item: TrackedItem;
  profile: CompanyProfile;
  onUpdateProjectDescription: (id: string, text: string) => void;
  onUpdateAiDraft: (id: string, text: string) => void;
}) {
  const [accessCode, setAccessCode] = useState(getSavedAccessCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGenerate = async () => {
    if (!item.projectDescription?.trim()) {
      setError("請先填寫上面「這次申請想做的計畫／產品簡述」再生成草稿");
      return;
    }
    if (!accessCode.trim()) {
      setError("請輸入存取密碼");
      return;
    }
    setLoading(true);
    setError(null);
    saveAccessCode(accessCode.trim());
    try {
      const draft = await generateDraft({
        accessCode: accessCode.trim(),
        companyName: profile.companyName,
        foundedYear: profile.foundedYear,
        capital: profile.capital,
        industry: profile.industry,
        grantName: item.name,
        agency: item.agency,
        grantSummary: item.grantSummary,
        requirementNotes: item.requirementNotes,
        projectDescription: item.projectDescription,
      });
      onUpdateAiDraft(item.id, draft);
    } catch (e) {
      setError(e instanceof DraftApiError ? e.message : "生成失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 rounded-md bg-slate-50 border border-slate-200 p-2.5">
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">這次申請想做的計畫／產品簡述</label>
        <textarea
          value={item.projectDescription || ""}
          onChange={(e) => onUpdateProjectDescription(item.id, e.target.value)}
          placeholder="例如：開發一款結合 AI 角色互動的手機遊戲，目前已完成原型，這筆補助想用於擴充美術與伺服器成本"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="password"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="存取密碼"
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <button
          onClick={runGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          AI 生成申請草稿
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {item.aiDraft && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">AI 生成草稿（可編輯）</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => navigator.clipboard?.writeText(item.aiDraft || "").catch(() => {})}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-slate-400"
              >
                <Copy className="h-3 w-3" />
                複製
              </button>
              <button
                onClick={() => downloadTextFile(`${item.name}_AI草稿.txt`, item.aiDraft || "")}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-slate-400"
              >
                <Download className="h-3 w-3" />
                下載
              </button>
            </div>
          </div>
          <textarea
            value={item.aiDraft}
            onChange={(e) => onUpdateAiDraft(item.id, e.target.value)}
            rows={8}
            className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs leading-relaxed focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <p className="text-[11px] text-amber-700">
            ⚠ AI 草稿僅供參考，可能不夠精確或遺漏細節，請務必自行查核修改後再使用，不保證內容正確性或申請核准機率。
          </p>
        </div>
      )}
    </div>
  );
}

function TrackedCard({
  item,
  profile,
  onUpdateStatus,
  onRemove,
  onToggleChecklistItem,
  onUpdateProjectDescription,
  onUpdateAiDraft,
}: {
  item: TrackedItem;
  profile: CompanyProfile;
  onUpdateStatus: (id: string, status: TrackedStatus) => void;
  onRemove: (id: string) => void;
  onToggleChecklistItem: (trackedId: string, checklistId: string) => void;
  onUpdateProjectDescription: (id: string, text: string) => void;
  onUpdateAiDraft: (id: string, text: string) => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const timeline = item.endDate ? buildPrepTimeline(item.endDate) : [];
  const doneCount = item.checklist.filter((c) => c.done).length;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{item.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{item.agency}</span>
            {item.deadlineText && (
              <>
                <span>·</span>
                <span>{item.deadlineText}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <CountdownBadge endDate={item.endDate} />
          <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-rose-600" aria-label="移除追蹤">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdateStatus(item.id, opt.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              item.status === opt.value ? STATUS_CLS[opt.value] : "bg-white border border-slate-200 text-slate-400 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          官方計畫頁面 <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-2.5">
        <button
          onClick={() => setShowChecklist((s) => !s)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          {showChecklist ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <ListChecks className="h-3.5 w-3.5" />
          應備文件清單（{doneCount}/{item.checklist.length}）
        </button>
        {item.endDate && timeline.length > 0 && (
          <button
            onClick={() => setShowTimeline((s) => !s)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {showTimeline ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <Clock className="h-3.5 w-3.5" />
            建議準備時程
          </button>
        )}
        <button
          onClick={() => setShowAiDraft((s) => !s)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          {showAiDraft ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <Sparkles className="h-3.5 w-3.5" />
          AI 申請草稿
        </button>
      </div>

      {showChecklist && (
        <div className="mt-2 space-y-1.5 rounded-md bg-slate-50 border border-slate-200 p-2.5">
          {item.checklist.map((c) => (
            <label key={c.id} className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={c.done}
                onChange={() => onToggleChecklistItem(item.id, c.id)}
                className="mt-0.5"
              />
              <span className={c.done ? "line-through text-slate-400" : ""}>{c.label}</span>
            </label>
          ))}
          <p className="pt-1 text-[11px] text-slate-400">
            通用清單僅供參考，並非逐項查證該計畫官方規定，請務必對照官方公告確認實際應備文件。
          </p>
        </div>
      )}

      {showTimeline && timeline.length > 0 && (
        <div className="mt-2 space-y-1 rounded-md bg-slate-50 border border-slate-200 p-2.5">
          {timeline.map((m) => (
            <div key={m.daysBefore} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="shrink-0 font-medium text-slate-700">{m.date}</span>
              <span>{m.label}</span>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-slate-400">
            時程切點為經驗法則估算，非官方規定的精確數據，請依實際情況調整。
          </p>
        </div>
      )}

      {showAiDraft && (
        <AiDraftSection
          item={item}
          profile={profile}
          onUpdateProjectDescription={onUpdateProjectDescription}
          onUpdateAiDraft={onUpdateAiDraft}
        />
      )}
    </div>
  );
}

export function TrackedTab({
  tracked,
  profile,
  onUpdateStatus,
  onRemove,
  onGoToGrants,
  onToggleChecklistItem,
  onUpdateProjectDescription,
  onUpdateAiDraft,
}: Props) {
  if (tracked.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">我要申請</h2>
          <p className="mt-1 text-xs text-slate-500">集中管理你打算申請的補助計畫，狀態與清單存在這台瀏覽器，不會上傳。</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          還沒有加入任何補助計畫。在補助查詢頁的卡片上點「加入追蹤」即可開始管理。
          <button onClick={onGoToGrants} className="mt-3 block w-full text-sky-700 hover:underline">
            前往補助查詢 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-800">我要申請</h2>
        <p className="mt-1 text-xs text-slate-500">
          共追蹤 {tracked.length} 筆補助計畫，狀態與清單存在這台瀏覽器，不會上傳到伺服器。
        </p>
      </div>

      <div className="space-y-3">
        {tracked.map((item) => (
          <TrackedCard
            key={item.id}
            item={item}
            profile={profile}
            onUpdateStatus={onUpdateStatus}
            onRemove={onRemove}
            onToggleChecklistItem={onToggleChecklistItem}
            onUpdateProjectDescription={onUpdateProjectDescription}
            onUpdateAiDraft={onUpdateAiDraft}
          />
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Bookmark className="h-3.5 w-3.5" />
        在補助查詢頁的卡片上再點一次「已追蹤」可移除。
      </p>
    </div>
  );
}
