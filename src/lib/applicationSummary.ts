import type { CompanyProfile } from "../types";
import { INDUSTRY_OPTIONS, REGION_OPTIONS } from "../data/grants";

function findLabel(options: { value: string; label: string }[], value: string | undefined): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label || value;
}

// 把公司資料整理成一段格式化文字，方便使用者複製貼到官方申請表單，
// 省去重複輸入同樣的公司基本資料。
export function buildApplicationSummaryText(profile: CompanyProfile): string {
  const lines: string[] = ["【公司基本資料】"];

  lines.push(`公司名稱：${profile.companyName || "（未填寫）"}`);
  if (profile.taxId) lines.push(`統一編號：${profile.taxId}`);
  if (profile.foundedYear) lines.push(`成立年份：${profile.foundedYear} 年`);
  if (profile.capital) lines.push(`資本額：新臺幣 ${Number(profile.capital).toLocaleString()} 元`);

  const industryLabel = findLabel(INDUSTRY_OPTIONS, profile.industry);
  if (industryLabel) lines.push(`產業別：${industryLabel}`);

  const regionLabel = findLabel(REGION_OPTIONS, profile.region);
  if (regionLabel) lines.push(`登記地區：${regionLabel}`);

  if (profile.experience) lines.push(`近 3 年同類型履約件數：${profile.experience} 件`);

  if (profile.certs && profile.certs.length > 0) {
    lines.push(`持有證照／驗證：${profile.certs.join("、")}`);
  }

  if (profile.businessCodes && profile.businessCodes.length > 0) {
    lines.push(`所營事業代碼：${profile.businessCodes.join("、")}`);
  }

  lines.push("");
  lines.push("※本摘要由「標案補助查詢工具」自動產生，請對照官方申請表單欄位調整後使用，正式送件前請再次確認資料正確性。");

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
