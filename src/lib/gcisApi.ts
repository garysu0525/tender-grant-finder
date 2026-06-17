import type { GcisBasicRecord, GcisBusinessRecord, ImportedCompanyInfo } from "../types";

// ⚠ 暫未串接到 UI：實測驗證此 API 沒有開放 CORS（回應不帶 Access-Control-Allow-Origin），
// 瀏覽器端直接 fetch 會被擋下。此檔案的查詢邏輯已驗證可用，待加入後端 proxy 後即可重新接上 ProfileForm。
//
// 經濟部商工行政資料開放平臺
// 公司登記基本資料-應用一（名稱/資本額/地址/設立日期）
const GCIS_API_BASE = "https://data.gcis.nat.gov.tw/od/data/api";
const DATASET_BASIC = "5F64D864-61CB-4D0D-8AD9-492047CC1EA6";
// 公司登記基本資料-應用三（所營事業項目，含行業代碼）
const DATASET_BUSINESS = "236EE382-4942-41A9-BD03-CA0709025E7C";

export class GcisApiError extends Error {}

// 直轄市/省轄市地址關鍵字 -> 我們公司資料表單的 region 選項值
// 其餘縣市目前表單沒有對應選項，一律歸類為 other，讓使用者自行確認。
const CITY_REGION_MAP: [RegExp, string][] = [
  [/臺北市|台北市/, "taipei"],
  [/新北市/, "newtaipei"],
  [/桃園市/, "taoyuan"],
  [/臺中市|台中市/, "taichung"],
  [/臺南市|台南市/, "tainan"],
  [/高雄市/, "kaohsiung"],
];

function guessRegionFromAddress(address: string): string | null {
  for (const [pattern, value] of CITY_REGION_MAP) {
    if (pattern.test(address)) return value;
  }
  return address ? "other" : null;
}

// 民國年日期 "0760221" -> 1987（年份）
function rocSetupDateToYear(s: string | undefined): string {
  if (!s || s.length < 3) return "";
  const rocYear = Number(s.slice(0, s.length - 4));
  if (!Number.isFinite(rocYear) || rocYear <= 0) return "";
  return String(rocYear + 1911);
}

async function gcisFetch<T>(dataset: string, taxId: string): Promise<T[]> {
  const url = new URL(`${GCIS_API_BASE}/${dataset}`);
  url.searchParams.set("$format", "json");
  url.searchParams.set("$filter", `Business_Accounting_NO eq ${taxId}`);
  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (e) {
    throw new GcisApiError("無法連線至經濟部商工行政資料開放平臺");
  }
  if (!res.ok) {
    throw new GcisApiError(`API 回應狀態 ${res.status}`);
  }
  const text = await res.text();
  if (!text.trim()) return [];
  try {
    return JSON.parse(text) as T[];
  } catch (e) {
    throw new GcisApiError("回應格式錯誤，請確認統一編號是否正確");
  }
}

export async function importCompanyProfile(taxId: string): Promise<ImportedCompanyInfo> {
  const id = taxId.trim();
  if (!/^\d{8}$/.test(id)) {
    throw new GcisApiError("統一編號須為 8 位數字");
  }

  const [basicRecords, businessRecords] = await Promise.all([
    gcisFetch<GcisBasicRecord>(DATASET_BASIC, id),
    gcisFetch<GcisBusinessRecord>(DATASET_BUSINESS, id),
  ]);

  const basic = basicRecords[0];
  if (!basic) {
    throw new GcisApiError("查無此統一編號的公司登記資料，請確認輸入是否正確");
  }

  const business = businessRecords[0];
  const businessCodes = business
    ? Array.from(
        new Set(
          business.Cmp_Business.map((b) => b.Business_Item?.trim()).filter(
            (code): code is string => Boolean(code)
          )
        )
      )
    : [];

  return {
    companyName: basic.Company_Name,
    foundedYear: rocSetupDateToYear(basic.Company_Setup_Date),
    capital: basic.Paid_In_Capital_Amount != null ? String(basic.Paid_In_Capital_Amount) : "",
    region: guessRegionFromAddress(basic.Company_Location || ""),
    businessCodes,
    rawAddress: basic.Company_Location || "",
  };
}
