// Vercel serverless function：即時抓取國家科學及技術委員會「計畫徵求專區」公告
// 實測驗證：此頁面是伺服器端直接渲染 HTML（非 JS 渲染），可用一般 HTTP fetch + HTML 解析取得，
// 不需要無頭瀏覽器。每筆公告附有精確的「徵求期間」，故可顯示真實倒數，而非憑空編造的天數。
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

const NSTC_RFP_URL = "https://www.nstc.gov.tw/folksonomy/rfpList?l=ch";
const NSTC_BASE = "https://www.nstc.gov.tw";

export interface LiveGrantItem {
  id: string;
  source: "nstc";
  title: string;
  highlight: string;
  phase: string;
  category: string;
  area: string;
  periodText: string; // 原始民國年期間文字，例如「115年6月15日至115年9月14日」
  startDate: string | null; // ISO 日期，解析失敗則為 null
  endDate: string | null;
  url: string;
}

// 民國年中文日期「115年6月15日」-> ISO "2026-06-15"；"即日起" 視為 null（代表即時生效）
function parseRocChineseDate(text: string): string | null {
  const m = text.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return null;
  const year = Number(m[1]) + 1911;
  const month = String(m[2]).padStart(2, "0");
  const day = String(m[3]).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePeriod(raw: string): { startDate: string | null; endDate: string | null; periodText: string } {
  const periodText = raw.replace(/\s+/g, "").replace(/<br\/?>/g, "");
  const isImmediate = /即日起/.test(periodText);
  const dates = periodText.match(/\d{2,3}年\d{1,2}月\d{1,2}日/g) || [];
  const startDate = isImmediate ? null : dates[0] ? parseRocChineseDate(dates[0]) : null;
  const endDate = dates.length > 1 ? parseRocChineseDate(dates[1]) : dates[0] ? parseRocChineseDate(dates[0]) : null;
  return { startDate, endDate, periodText };
}

async function fetchNstcGrants(): Promise<LiveGrantItem[]> {
  const res = await fetch(NSTC_RFP_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`NSTC_HTTP_${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const items: LiveGrantItem[] = [];

  $(".plan_table table tbody tr").each((_, el) => {
    const $row = $(el);
    if ($row.find("th").length > 0) return; // 跳過表頭

    const titleLink = $row.find('a.show_detail').first();
    const title = titleLink.text().trim();
    if (!title) return;
    const href = titleLink.attr("href") || "";
    const highlight = $row.find('td[headers="highlight"]').text().trim();
    const phase = $row.find('td[headers="phase"]').text().trim();
    const periodRaw = $row.find('td[headers="activityStartDate"]').html() || "";
    const category = $row.find('td[headers="category"]').text().trim();
    const area = $row.find('td[headers="area"]').text().trim();
    const { startDate, endDate, periodText } = parsePeriod(periodRaw);

    items.push({
      id: href || title,
      source: "nstc",
      title,
      highlight,
      phase,
      category,
      area,
      periodText,
      startDate,
      endDate,
      url: href ? `${NSTC_BASE}${href}` : NSTC_BASE,
    });
  });

  return items;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const items = await fetchNstcGrants();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.status(200).json({ items, fetchedAt: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ error: "無法取得即時補助公告，請稍後再試" });
  }
}
