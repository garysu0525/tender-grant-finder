import type { CompanyProfile, GrantRequirements, MatchResult } from "../types";

// 補助計畫資格比對：資料是我們自己彙整的結構化資料，可以做嚴格的 符合/不符/待確認 三態判斷。
// 優先順序：任一 fail -> fail；無 fail 但有 unknown -> unknown；全部通過 -> pass。
export function evaluateGrantMatch(
  profile: CompanyProfile | null,
  req: GrantRequirements
): MatchResult {
  if (!profile) return { status: "unknown", reasons: ["尚未填寫公司資料"] };

  const reasons: string[] = [];
  let hasFail = false;
  let hasUnknown = false;

  if (req.capital) {
    if (!profile.capital) {
      hasUnknown = true;
      reasons.push(`待確認：${req.capital.label}`);
    } else {
      const cap = Number(profile.capital);
      const okMin = req.capital.min == null || cap >= req.capital.min;
      const okMax = req.capital.max == null || cap <= req.capital.max;
      if (okMin && okMax) {
        reasons.push(`符合：${req.capital.label}`);
      } else {
        hasFail = true;
        reasons.push(`不符：${req.capital.label}（目前填寫 ${cap.toLocaleString()} 元）`);
      }
    }
  }

  if (req.companyAge) {
    if (!profile.foundedYear) {
      hasUnknown = true;
      reasons.push(`待確認：${req.companyAge.label}`);
    } else {
      const age = new Date().getFullYear() - Number(profile.foundedYear);
      const okMin = req.companyAge.min == null || age >= req.companyAge.min;
      const okMax = req.companyAge.max == null || age <= req.companyAge.max;
      if (okMin && okMax) {
        reasons.push(`符合：${req.companyAge.label}`);
      } else {
        hasFail = true;
        reasons.push(`不符：${req.companyAge.label}（公司成立 ${age} 年）`);
      }
    }
  }

  if (req.industry) {
    if (req.industry.allow.includes("all")) {
      reasons.push(`符合：${req.industry.label}`);
    } else if (!profile.industry) {
      hasUnknown = true;
      reasons.push(`待確認：${req.industry.label}`);
    } else if (req.industry.allow.includes(profile.industry)) {
      reasons.push(`符合：${req.industry.label}`);
    } else {
      hasFail = true;
      reasons.push(`不符：${req.industry.label}`);
    }
  }

  if (req.region) {
    if (req.region.allow.includes("all")) {
      reasons.push(`符合：${req.region.label}`);
    } else if (!profile.region) {
      hasUnknown = true;
      reasons.push(`待確認：${req.region.label}`);
    } else if (req.region.allow.includes(profile.region)) {
      reasons.push(`符合：${req.region.label}`);
    } else {
      hasFail = true;
      reasons.push(`不符：${req.region.label}`);
    }
  }

  if (req.certs && req.certs.length > 0) {
    const have = profile.certs || [];
    const missing = req.certs.filter((c) => !have.includes(c));
    if (missing.length === 0) {
      reasons.push(`符合：具備所需證照（${req.certs.join("、")}）`);
    } else {
      hasUnknown = true;
      reasons.push(`待確認：需具備 ${missing.join("、")} 證照`);
    }
  }

  if (req.experience) {
    if (profile.experience === "" || profile.experience == null) {
      hasUnknown = true;
      reasons.push(`待確認：${req.experience.label}`);
    } else {
      const exp = Number(profile.experience);
      if (exp >= req.experience.min) {
        reasons.push(`符合：${req.experience.label}`);
      } else {
        hasFail = true;
        reasons.push(`不符：${req.experience.label}（目前填寫 ${exp} 件）`);
      }
    }
  }

  if (hasFail) return { status: "fail", reasons };
  if (hasUnknown) return { status: "unknown", reasons };
  return { status: "pass", reasons };
}
