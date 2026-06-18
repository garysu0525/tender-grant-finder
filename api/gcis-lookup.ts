// Vercel serverless function：代理經濟部商工行政資料開放平臺查詢
// 該 API 未開放 CORS，瀏覽器端無法直接 fetch，所以由這個後端 function 代為查詢再回傳給前端。
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GCIS_API_BASE = "https://data.gcis.nat.gov.tw/od/data/api";
const DATASET_BASIC = "5F64D864-61CB-4D0D-8AD9-492047CC1EA6";
const DATASET_BUSINESS = "236EE382-4942-41A9-BD03-CA0709025E7C";

interface GcisBasicRecord {
  Business_Accounting_NO: string;
  Company_Name: string;
  Capital_Stock_Amount: number;
  Paid_In_Capital_Amount: number;
  Company_Location: string;
  Company_Setup_Date: string;
}

interface GcisBusinessItem {
  Business_Item: string;
  Business_Item_Desc: string;
}

interface GcisBusinessRecord {
  Cmp_Business: GcisBusinessItem[];
}

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
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GCIS_HTTP_${res.status}`);
  const text = await res.text();
  if (!text.trim()) return [];
  return JSON.parse(text) as T[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const taxId = String(req.query.taxId || "").trim();
  if (!/^\d{8}$/.test(taxId)) {
    res.status(400).json({ error: "統一編號須為 8 位數字" });
    return;
  }

  try {
    const [basicRecords, businessRecords] = await Promise.all([
      gcisFetch<GcisBasicRecord>(DATASET_BASIC, taxId),
      gcisFetch<GcisBusinessRecord>(DATASET_BUSINESS, taxId),
    ]);

    const basic = basicRecords[0];
    if (!basic) {
      res.status(404).json({ error: "查無此統一編號的公司登記資料，請確認輸入是否正確" });
      return;
    }

    const business = businessRecords[0];
    const businessCodes = business
      ? Array.from(
          new Set(
            business.Cmp_Business.map((b) => b.Business_Item?.trim()).filter((code): code is string => Boolean(code))
          )
        )
      : [];

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json({
      companyName: basic.Company_Name,
      foundedYear: rocSetupDateToYear(basic.Company_Setup_Date),
      capital: basic.Paid_In_Capital_Amount != null ? String(basic.Paid_In_Capital_Amount) : "",
      region: guessRegionFromAddress(basic.Company_Location || ""),
      businessCodes,
      rawAddress: basic.Company_Location || "",
    });
  } catch (e) {
    res.status(502).json({ error: "無法連線至經濟部商工行政資料開放平臺，請稍後再試" });
  }
}
