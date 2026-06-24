// 簡單的 localStorage 包裝，僅存在使用者瀏覽器本機，不會上傳到任何伺服器。
// 所有讀寫都包 try/catch，避免無痕模式或瀏覽器封鎖 localStorage 時整個 App 掛掉。

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 儲存失敗（例如無痕模式、容量已滿）就靜默忽略，資料仍可在當次瀏覽中正常使用
  }
}

export const STORAGE_KEYS = {
  profile: "tgf:companyProfile",
  tracked: "tgf:trackedItems",
} as const;
