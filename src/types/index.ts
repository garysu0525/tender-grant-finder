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

export interface Grant {
  id: string;
  name: string;
  agency: string;
  category: string;
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
  industryCodes: string[];
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
