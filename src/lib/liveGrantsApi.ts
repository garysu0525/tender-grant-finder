import type { LiveGrantsResponse } from "../types";

export class LiveGrantsApiError extends Error {}

export async function fetchLiveGrants(): Promise<LiveGrantsResponse> {
  let res: Response;
  try {
    res = await fetch("/api/live-grants");
  } catch (e) {
    throw new LiveGrantsApiError("無法連線至即時補助公告服務");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new LiveGrantsApiError(data?.error || `查詢失敗（${res.status}）`);
  }
  return data as LiveGrantsResponse;
}

// 計算距截止日剩餘天數；無截止日或已過期則回傳 null
export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const end = new Date(isoDate + "T23:59:59");
  const diffMs = end.getTime() - Date.now();
  if (diffMs < 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
