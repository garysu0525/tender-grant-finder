export class DraftApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export interface GenerateDraftParams {
  accessCode: string;
  companyName?: string;
  foundedYear?: string;
  capital?: string;
  industry?: string;
  grantName: string;
  agency: string;
  grantSummary?: string;
  requirementNotes?: string;
  projectDescription: string;
}

export async function generateDraft(params: GenerateDraftParams): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (e) {
    throw new DraftApiError("無法連線至 AI 草稿服務，請稍後再試");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new DraftApiError(data?.error || `生成失敗（${res.status}）`, res.status);
  }
  return data.draft as string;
}

const ACCESS_CODE_KEY = "tgf:draftAccessCode";

export function getSavedAccessCode(): string {
  try {
    return localStorage.getItem(ACCESS_CODE_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function saveAccessCode(code: string): void {
  try {
    localStorage.setItem(ACCESS_CODE_KEY, code);
  } catch (e) {
    // 忽略寫入失敗
  }
}
