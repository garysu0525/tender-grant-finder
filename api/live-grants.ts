// Vercel serverless function：即時抓取政府補助公告
// - 國科會「計畫徵求專區」：伺服器端直接渲染 HTML（非 JS 渲染），一般 HTTP fetch 即可取得
// - 文化部「獎補助資訊網」：清單頁本身是 JS 渲染，但實測攔截到底層 JSON API
//   (POST /Web/API/PointListData.jsp)，可直接呼叫拿到資料，同樣不需要無頭瀏覽器
// 兩者皆附精確的受理/徵求期間，可顯示真實倒數，而非憑空編造的天數。
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

const NSTC_RFP_URL = "https://www.nstc.gov.tw/folksonomy/rfpList?l=ch";
const NSTC_BASE = "https://www.nstc.gov.tw";
const MOC_API_URL = "https://grants.moc.gov.tw/Web/API/PointListData.jsp";
const MOC_BASE = "https://grants.moc.gov.tw/Web/";

export interface LiveGrantItem {
  id: string;
  source: "nstc" | "moc";
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

// 文化部 data-countdown 格式："2026/07/20 17:30:59"（西元年，含秒）-> ISO "2026-07-20T17:30:59"
function mocCountdownToIso(s: string | undefined): string | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
}

// 文化部期間文字「115/06/18」（民國年）-> ISO "2026-06-18"
function mocRocSlashToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]) + 1911;
  return `${year}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
}

async function fetchMocGrants(): Promise<LiveGrantItem[]> {
  const res = await fetch(MOC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://grants.moc.gov.tw/Web/PointList.jsp",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      OP: "pointList",
      perSize: 100,
      offset: 0,
      DataStatus: "1", // 1 = 開放申請中
      keyWord: "",
      unitKeyWord: "",
      typeKeyWord: "",
      onlineStatus: "",
      orderType: "date0",
      targetVal: "",
      startDate: "",
      endDate: "",
    }),
  });
  if (!res.ok) throw new Error(`MOC_HTTP_${res.status}`);
  const data = await res.json();
  const $ = cheerio.load(data.HtmlContent || "");
  const items: LiveGrantItem[] = [];

  $(".item").each((_, itemEl) => {
    const $item = $(itemEl);
    const agency = $item.find("small").first().text().trim();

    $item.find("li.list-group-item").each((__, liEl) => {
      const $li = $(liEl);
      const titleA = $li.find("a").first();
      const title = titleA.text().trim();
      const href = titleA.attr("href") || "";
      const applicantType = $li.find("div.col-lg-2").first().text().trim();
      const timeEl = $li.find("time");
      const endDate = mocCountdownToIso(timeEl.attr("data-countdown"));
      const rangeText = timeEl.find("span").first().text().trim();
      const startDate = mocRocSlashToIso(rangeText.split("~")[0] || "");
      if (!title) return;

      items.push({
        id: href || `${title}-${applicantType}`,
        source: "moc",
        title,
        highlight: "",
        phase: "",
        category: agency,
        area: applicantType,
        periodText: rangeText,
        startDate,
        endDate,
        url: href ? `${MOC_BASE}${href}` : MOC_BASE,
      });
    });
  });

  return items;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results = await Promise.allSettled([fetchNstcGrants(), fetchMocGrants()]);
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const errors = results.filter((r) => r.status === "rejected").length;

  if (items.length === 0 && errors > 0) {
    res.status(502).json({ error: "無法取得即時補助公告，請稍後再試" });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
  res.status(200).json({ items, fetchedAt: new Date().toISOString(), partial: errors > 0 });
}
