export type MatchStatus = "pass" | "fail" | "unknown";

export interface MatchResult {
  status: MatchStatus;
  reasons: string[];
}

export interface CompanyProfile {
  companyName?: string;
  foundedYear?: string;
  capital?: string;
  experience?: string;
  industry?: string;
  region?: string;
  certs?: string[];
  taxId?: string;
  businessCodes?: string[]; // 公司登記之所營事業行業代碼，從統一編號自動帶入
}

export interface RangeRequirement {
  min?: number;
  max?: number;
  label: string;
}

export interface AllowListRequirement {
  allow: string[];
  label: string;
}

export interface GrantRequirements {
  companyAge?: RangeRequirement;
  capital?: RangeRequirement;
  industry?: AllowListRequirement;
  region?: AllowListRequirement;
  certs?: string[];
  experience?: { min: number; label: string };
  note?: string;
}

export type GrantAcceptanceStatus = "rolling" | "scheduled" | "loan";

export interface Grant {
  id: string;
  name: string;
  agency: string;
  category: string;
  summary: string; // 一句話白話摘要，幫助使用者快速判斷是否相關
  applicantType: string; // 申請對象，例如「中小企業／公司」「團體／非營利組織」
  acceptanceStatus: GrantAcceptanceStatus; // rolling=全年受理、scheduled=依年度公告期間、loan=低利貸款非無償補助
  amount: string;
  deadline: string;
  url: string;
  requirements: GrantRequirements;
}

// --- 標案（PCC 開放資料）---
// 已用 https://pcc-api.openfun.app/api/searchbytitle 實測驗證的真實欄位結構

export interface PccSearchCompanies {
  ids: string[];
  names: string[];
  id_key: Record<string, string>;
  name_key: Record<string, string>;
}

export interface PccSearchBrief {
  type: string;
  title: string;
  category: string;
  companies: PccSearchCompanies;
}

export interface PccSearchRecord {
  date: number; // YYYYMMDD
  filename: string;
  brief: PccSearchBrief;
  job_number: string;
  unit_id: string;
  unit_name: string;
  unit_api_url: string;
  tender_api_url: string;
  unit_url: string;
  url: string; // 相對路徑，需接 https://web.pcc.gov.tw
}

export interface PccSearchResponse {
  query: string;
  page: number;
  total_records: number;
  total_pages: number;
  took: number;
  records: PccSearchRecord[];
}

// tender detail API：detail 欄位是政府採購網表單逐欄轉出的中文 key-value，格式不統一
export interface PccTenderDetailRecord {
  date: number;
  filename: string;
  brief: PccSearchBrief;
  job_number: string;
  unit_id: string;
  detail: Record<string, string>;
}

export interface PccTenderDetailResponse {
  unit_name: string;
  records: PccTenderDetailRecord[];
}

// 標案資格警示標籤（從「廠商資格摘要」關鍵字規則解析出來，僅供提示，非嚴格比對）
export type TenderFlagType =
  | "industry_code_restriction"
  | "china_exclusion"
  | "disability_aboriginal_priority";

export interface TenderFlag {
  type: TenderFlagType;
  label: string;
}

export interface TenderQualificationInfo {
  cleanedSummary: string | null;
  hasExtraRequirement: boolean;
  flags: TenderFlag[];
  industryCodes: string[]; // 顯示用，含中文業別名稱
  industryCodeIds: string[]; // 純代碼（例如 "CC01080"），用於跟公司登記代碼比對
}

export interface TenderListItem {
  id: string;
  title: string;
  unitName: string;
  unitId: string;
  jobNumber: string;
  category: string;
  date: string; // 顯示用，YYYY/MM/DD
  url: string; // 完整網址
  tenderApiUrl: string;
}

export interface TenderDetailInfo {
  budgetAmount: string | null;
  deadline: string | null;
  bidOpenDate: string | null;
  qualification: TenderQualificationInfo;
}

// --- 經濟部商工行政資料開放平臺（統一編號自動帶入公司資料）---
// 已用 data.gcis.nat.gov.tw 實測驗證的真實欄位結構

export interface GcisBasicRecord {
  Business_Accounting_NO: string;
  Company_Name: string;
  Company_Status_Desc: string;
  Capital_Stock_Amount: number;
  Paid_In_Capital_Amount: number;
  Company_Location: string;
  Company_Setup_Date: string; // 民國年，例如 "0760221"
}

export interface GcisBusinessItem {
  Business_Seq_NO: string;
  Business_Item: string; // 行業代碼，例如 "CC01080"；部分項目為純文字說明，此欄會是空白
  Business_Item_Desc: string;
}

export interface GcisBusinessRecord {
  Business_Accounting_NO: string;
  Company_Name: string;
  Cmp_Business: GcisBusinessItem[];
}

export interface ImportedCompanyInfo {
  companyName: string;
  foundedYear: string;
  capital: string;
  region: string | null; // 解析失敗則為 null，留給使用者自行選擇
  businessCodes: string[];
  rawAddress: string;
}

// --- 即時補助公告（國科會計畫徵求專區 + 文化部獎補助資訊網，由 /api/live-grants 即時抓取）---
// 兩個來源都是伺服器端直接吐資料（國科會是渲染好的 HTML，文化部則有底層 JSON API），
// 不需要無頭瀏覽器；每筆公告都有精確徵求/受理期間，可顯示真實倒數。

export type LiveGrantSource = "nstc" | "moc";

export interface LiveGrantItem {
  id: string;
  source: LiveGrantSource;
  title: string;
  highlight: string;
  phase: string;
  category: string; // nstc: 計畫類別；moc: 受理單位
  area: string; // nstc: 計畫領域；moc: 獎補助對象
  periodText: string;
  startDate: string | null; // ISO 日期
  endDate: string | null; // ISO 日期時間（moc 精確到秒）
  url: string;
}

export interface LiveGrantsResponse {
  items: LiveGrantItem[];
  fetchedAt: string;
  partial?: boolean; // 若為 true，代表至少一個來源抓取失敗，items 可能不完整
}
