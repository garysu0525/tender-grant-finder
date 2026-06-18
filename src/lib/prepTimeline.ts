export interface PrepMilestone {
  date: string; // ISO 日期 (YYYY-MM-DD)
  daysBefore: number;
  label: string;
}

// 通用準備時程的經驗法則切點，不是針對特定計畫驗證過的精確數據——
// 只有即時公告（國科會/文化部）有精確截止日才能算這個，長期性計畫多半沒有明確日期不適用。
const DEFAULT_OFFSETS: { daysBefore: number; label: string }[] = [
  { daysBefore: 30, label: "開始準備財務報表、登記文件" },
  { daysBefore: 21, label: "確認所需證照／資格文件齊全" },
  { daysBefore: 14, label: "完成申請計畫書初稿" },
  { daysBefore: 7, label: "內部審核、用印（公司大小章用印請預留時間）" },
  { daysBefore: 2, label: "送出前最後檢查，預留系統壅塞緩衝時間" },
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 只回傳「現在到截止日之間」尚未過期的時程點，過去的切點不顯示
export function buildPrepTimeline(endDateIso: string): PrepMilestone[] {
  const end = new Date(endDateIso);
  const today = new Date(new Date().toDateString());

  return DEFAULT_OFFSETS.map((o) => {
    const d = new Date(end);
    d.setDate(d.getDate() - o.daysBefore);
    return { date: toIsoDate(d), daysBefore: o.daysBefore, label: o.label };
  }).filter((m) => new Date(m.date) >= today);
}
