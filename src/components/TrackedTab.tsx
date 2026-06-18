import { ExternalLink, Trash2, Bookmark } from "lucide-react";
import type { TrackedItem, TrackedStatus } from "../types";

interface Props {
  tracked: TrackedItem[];
  onUpdateStatus: (id: string, status: TrackedStatus) => void;
  onRemove: (id: string) => void;
  onGoToGrants: () => void;
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

export function TrackedTab({ tracked, onUpdateStatus, onRemove, onGoToGrants }: Props) {
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
          <div key={item.id} className="rounded-lg border border-slate-200 p-4">
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
              <button
                onClick={() => onRemove(item.id)}
                className="shrink-0 text-slate-400 hover:text-rose-600"
                aria-label="移除追蹤"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Bookmark className="h-3.5 w-3.5" />
        在補助查詢頁的卡片上再點一次「已追蹤」可移除。
      </p>
    </div>
  );
}
