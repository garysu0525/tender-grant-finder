// Vercel serverless function：用 Claude API 生成補助申請草稿段落
// 需要兩個環境變數：ANTHROPIC_API_KEY（呼叫 Claude）、DRAFT_ACCESS_CODE（簡單存取密碼，
// 因為這個網站完全公開無登入，沒有這道鎖任何訪客都能打這支 API 燒掉 API 額度）。
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `你是政府補助申請文件助手。任務是根據使用者提供的「已確認事實」，生成一段繁體中文的「資格符合與申請動機說明」草稿，供申請人自行編輯後使用於正式申請書。

規則（務必嚴格遵守）：
1. 只能使用使用者提供的事實，絕對不可以編造公司沒有提及的具體實績、數字、日期、技術細節、得獎紀錄等。
2. 如果某項資訊使用者沒有提供但申請書通常需要（例如具體里程碑、預算明細、過往實績），請用「【請補充：說明需要什麼資訊】」標示出來，絕對不要自己掰一個出來填補。
3. 語氣正式、簡潔，適合放入政府補助申請書，但不要浮誇或使用行銷式誇大用語。
4. 輸出純文字段落，不要用 Markdown 標題符號或項目符號清單。
5. 長度約 300-500 字（繁體中文字計算）。`;

interface RequestBody {
  accessCode?: string;
  companyName?: string;
  foundedYear?: string;
  capital?: string;
  industry?: string;
  grantName?: string;
  agency?: string;
  grantSummary?: string;
  requirementNotes?: string;
  projectDescription?: string;
}

function buildUserMessage(body: RequestBody): string {
  const lines: string[] = ["【已確認事實】"];
  if (body.companyName) lines.push(`公司名稱：${body.companyName}`);
  if (body.foundedYear) lines.push(`成立年份：${body.foundedYear} 年`);
  if (body.capital) lines.push(`資本額：新臺幣 ${Number(body.capital).toLocaleString()} 元`);
  if (body.industry) lines.push(`產業別：${body.industry}`);
  lines.push("");
  lines.push("【申請的補助計畫】");
  if (body.grantName) lines.push(`計畫名稱：${body.grantName}`);
  if (body.agency) lines.push(`主辦機關：${body.agency}`);
  if (body.grantSummary) lines.push(`計畫簡介：${body.grantSummary}`);
  if (body.requirementNotes) lines.push(`資格備註：${body.requirementNotes}`);
  lines.push("");
  lines.push("【使用者描述的這次申請計畫／產品內容】");
  lines.push(body.projectDescription?.trim() || "（使用者尚未填寫，請在草稿中用【請補充】標示需要使用者補充計畫具體內容）");
  lines.push("");
  lines.push("請依照系統指示生成草稿。");
  return lines.join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expectedCode = process.env.DRAFT_ACCESS_CODE;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!expectedCode || !apiKey) {
    res.status(500).json({ error: "伺服器尚未設定 AI 草稿功能所需的環境變數" });
    return;
  }

  const body = (req.body || {}) as RequestBody;

  if (!body.accessCode || body.accessCode !== expectedCode) {
    res.status(401).json({ error: "存取密碼錯誤" });
    return;
  }

  if (!body.projectDescription || !body.projectDescription.trim()) {
    res.status(400).json({ error: "請先填寫「這次申請想做的計畫／產品簡述」再生成草稿" });
    return;
  }

  try {
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(body) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      res.status(502).json({ error: `AI 服務呼叫失敗（${anthropicRes.status}）`, detail: errText.slice(0, 300) });
      return;
    }

    const data = await anthropicRes.json();
    const draftText = data?.content?.[0]?.text || "";

    if (!draftText) {
      res.status(502).json({ error: "AI 服務沒有回傳內容，請稍後再試" });
      return;
    }

    res.status(200).json({ draft: draftText });
  } catch (e) {
    res.status(502).json({ error: "無法連線至 AI 服務，請稍後再試" });
  }
}
