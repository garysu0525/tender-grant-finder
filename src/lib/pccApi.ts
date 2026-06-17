import type {
  PccSearchResponse,
  PccTenderDetailResponse,
  TenderDetailInfo,
  TenderFlag,
  TenderListItem,
  TenderQualificationInfo,
} from "../types";

// 實測驗證：https://pcc.g0v.ronny.tw 已經會 301 導回首頁，真正在跑的後端是 pcc-api.openfun.app
export const PCC_API_BASE = "https://pcc-api.openfun.app/api";
export const PCC_WEB_BASE = "https://web.pcc.gov.tw";

export class PccApiError extends Error {}

function formatYyyymmdd(dateNum: number): string {
  const s = String(dateNum);
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

export interface SearchTendersResult {
  items: TenderListItem[];
  totalRecords: number;
  totalPages: number;
  page: number;
}

export async function searchTenders(query: string, page = 1): Promise<SearchTendersResult> {
  const url = `${PCC_API_BASE}/searchbytitle?query=${encodeURIComponent(query)}&page=${page}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new PccApiError("無法連線至政府電子採購網開放資料 API");
  }
  if (!res.ok) {
    throw new PccApiError(`API 回應狀態 ${res.status}`);
  }
  const data: PccSearchResponse = await res.json();
  const items: TenderListItem[] = (data.records || []).map((r, idx) => ({
    id: `${r.unit_id}-${r.job_number}-${idx}`,
    title: r.brief?.title || "（無標題）",
    unitName: r.unit_name || "未知機關",
    unitId: r.unit_id,
    jobNumber: r.job_number,
    category: r.brief?.category || "",
    date: formatYyyymmdd(r.date),
    url: r.url ? `${PCC_WEB_BASE}${r.url}` : PCC_WEB_BASE,
    tenderApiUrl: r.tender_api_url,
  }));
  return {
    items,
    totalRecords: data.total_records,
    totalPages: data.total_pages,
    page: data.page,
  };
}

// 政府採購網欄位金額格式："1,641,000元" -> 1641000
function parseAmountString(s: string | undefined): string | null {
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? `NT$ ${n.toLocaleString()}` : s;
}

// 民國年日期 "115/06/08 17:00" -> "2026/06/08 17:00"（僅用於顯示，不做嚴格驗證）
function rocDateToDisplay(s: string | undefined): string | null {
  if (!s) return null;
  const m = s.match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})(.*)$/);
  if (!m) return s;
  const year = Number(m[1]) + 1911;
  return `${year}/${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}${m[4]}`;
}

// --- 廠商資格摘要解析（關鍵字規則，僅供提示，非嚴格符合/不符判斷）---
//
// 實測發現「廠商資格摘要」欄位幾乎都以同一段固定樣板開頭：
// 「廠商登記或設立之證明投標廠商之基本資格須符合以下任一資格：具公司登記具商業登記廠商納稅之證明。如營業稅或所得稅」
// 這段只代表「須為合法登記公司」，沒有篩選力，可以濾掉。
// 真正客製化、有篩選力的內容通常接在「除上述外之其他資格」之後。
const EXTRA_REQUIREMENT_MARKER = "除上述外之其他資格";

// 台灣標準行業代碼格式：1-2 個英文字母 + 5-6 位數字，後面接中文業別名稱
const INDUSTRY_CODE_PATTERN = /[A-Z]{1,2}\d{5,6}[一-鿿（）()、,]{2,24}/g;

export function parseQualificationSummary(raw: string | undefined | null): TenderQualificationInfo {
  if (!raw || !raw.trim()) {
    return { cleanedSummary: null, hasExtraRequirement: false, flags: [], industryCodes: [] };
  }

  const markerIdx = raw.indexOf(EXTRA_REQUIREMENT_MARKER);
  const extraText = markerIdx >= 0 ? raw.slice(markerIdx + EXTRA_REQUIREMENT_MARKER.length).trim() : "";
  const hasExtraRequirement = extraText.length > 0;

  const industryCodes = hasExtraRequirement
    ? Array.from(
        new Set(
          (extraText.match(INDUSTRY_CODE_PATTERN) || []).map((s) => s.replace(/[、,]+$/, "").trim())
        )
      )
    : [];

  const flags: TenderFlag[] = [];
  if (industryCodes.length > 0) {
    flags.push({ type: "industry_code_restriction", label: "限特定行業代碼" });
  }
  if (/大陸地區廠商|陸資/.test(extraText)) {
    flags.push({ type: "china_exclusion", label: "排除陸資/大陸地區廠商" });
  }
  if (/身心障礙|原住民/.test(raw)) {
    flags.push({ type: "disability_aboriginal_priority", label: "身障/原住民優先名額" });
  }

  return {
    cleanedSummary: hasExtraRequirement ? extraText : null,
    hasExtraRequirement,
    flags,
    industryCodes,
  };
}

export async function fetchTenderDetail(unitId: string, jobNumber: string): Promise<TenderDetailInfo> {
  const url = `${PCC_API_BASE}/tender?unit_id=${encodeURIComponent(unitId)}&job_number=${encodeURIComponent(jobNumber)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new PccApiError("無法連線至標案詳情 API");
  }
  if (!res.ok) {
    throw new PccApiError(`API 回應狀態 ${res.status}`);
  }
  const data: PccTenderDetailResponse = await res.json();
  const record = data.records?.[0];
  const detail = record?.detail || {};

  const budgetAmount = parseAmountString(detail["採購資料:預算金額"]);
  const deadline = rocDateToDisplay(detail["領投開標:截止投標"]);
  const bidOpenDate = rocDateToDisplay(detail["領投開標:開標時間"]);
  const qualification = parseQualificationSummary(detail["其他:廠商資格摘要"]);

  return { budgetAmount, deadline, bidOpenDate, qualification };
}
