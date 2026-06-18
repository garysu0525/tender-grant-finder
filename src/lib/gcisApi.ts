import type { ImportedCompanyInfo } from "../types";

// 經濟部商工行政資料開放平臺沒有開放 CORS，瀏覽器端無法直接 fetch，
// 改打我們自己的 Vercel serverless function（/api/gcis-lookup）代為查詢。
export class GcisApiError extends Error {}

export async function importCompanyProfile(taxId: string): Promise<ImportedCompanyInfo> {
  const id = taxId.trim();
  if (!/^\d{8}$/.test(id)) {
    throw new GcisApiError("統一編號須為 8 位數字");
  }

  let res: Response;
  try {
    res = await fetch(`/api/gcis-lookup?taxId=${encodeURIComponent(id)}`);
  } catch (e) {
    throw new GcisApiError("無法連線至後端服務，請稍後再試");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GcisApiError(data?.error || `查詢失敗（${res.status}）`);
  }
  return data as ImportedCompanyInfo;
}
