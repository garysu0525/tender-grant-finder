import type { ChecklistItem } from "../types";

// 通用應備文件清單樣板。多數政府補助/標案申請都會用到這幾類文件，
// 不是逐一研究每個計畫官方規定的精確清單（那需要對 26+ 筆資料逐項查證，工作量很大），
// 而是先提供一份合理的通用起點，使用者可依官方公告自行增減項目。
const COMMON_ITEMS = [
  "公司登記或商業登記證明文件",
  "負責人身分證正反面影本",
  "最近一年度財務報表或營業稅／所得稅申報書",
  "申請計畫書／企劃書",
];

export function buildDefaultChecklist(note?: string): ChecklistItem[] {
  const labels = [...COMMON_ITEMS];
  if (note) labels.push(`依官方備註確認：${note}`);
  labels.push("對照官方計畫頁面確認完整應備文件清單");
  return labels.map((label, i) => ({ id: `c${i}`, label, done: false }));
}
