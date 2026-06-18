import { useState } from "react";
import { ExternalLink, Trash2, Bookmark, Clock, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import type { TrackedItem, TrackedStatus } from "../types";
import { daysUntil } from "../lib/liveGrantsApi";
import { buildPrepTimeline } from "../lib/prepTimeline";

interface Props {
  tracked: TrackedItem[];
  onUpdateStatus: (id: string, status: TrackedStatus) => void;
  onRemove: (id: string) => void;
  onGoToGrants: () => void;
  onToggleChecklistItem: (trackedId: string, checklistId: string) => void;
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

function TrackedCard({
  item,
  onUpdateStatus,
  onRemove,
  onToggleChecklistItem,
}: {
  item: TrackedItem;
  onUpdateStatus: (id: string, status: TrackedStatus) => void;
  onRemove: (id: string) => void;
  onToggleChecklistItem: (trackedId: string, checklistId: string) => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
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
    </div>
  );
}

export function TrackedTab({ tracked, onUpdateStatus, onRemove, onGoToGrants, onToggleChecklistItem }: Props) {
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
            onUpdateStatus={onUpdateStatus}
            onRemove={onRemove}
            onToggleChecklistItem={onToggleChecklistItem}
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
