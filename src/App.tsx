import { useEffect, useState } from "react";
import { Building2, FileSearch, ClipboardCheck, Bookmark } from "lucide-react";
import type { CompanyProfile, TrackedItem } from "./types";
import { TendersTab } from "./components/TendersTab";
import { GrantsTab } from "./components/GrantsTab";
import { ProfileForm } from "./components/ProfileForm";
import { TrackedTab } from "./components/TrackedTab";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "./lib/storage";
import { buildDefaultChecklist } from "./lib/applicationChecklist";

type TabId = "tenders" | "grants" | "tracked" | "profile";

// 相容舊版（Phase 2）存在 localStorage 但沒有 checklist/endDate 欄位的追蹤項目，
// 讀取時補上預設值，避免讀到舊資料時整頁當掉。
function normalizeTracked(items: TrackedItem[]): TrackedItem[] {
  return items.map((t) => ({
    ...t,
    endDate: t.endDate ?? null,
    checklist: t.checklist ?? buildDefaultChecklist(),
  }));
}

function App() {
  const [tab, setTab] = useState<TabId>("tenders");
  const [profile, setProfile] = useState<CompanyProfile>(() => loadFromStorage(STORAGE_KEYS.profile, {}));
  const [tracked, setTracked] = useState<TrackedItem[]>(() =>
    normalizeTracked(loadFromStorage(STORAGE_KEYS.tracked, []))
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.profile, profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.tracked, tracked);
  }, [tracked]);

  const hasProfile = Boolean(profile.companyName || profile.capital || profile.foundedYear);

  const toggleTracked = (item: Omit<TrackedItem, "status" | "addedAt">) => {
    setTracked((list) => {
      const exists = list.find((t) => t.id === item.id);
      if (exists) return list.filter((t) => t.id !== item.id);
      return [...list, { ...item, status: "interested", addedAt: new Date().toISOString() }];
    });
  };

  const updateTrackedStatus = (id: string, status: TrackedItem["status"]) => {
    setTracked((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const removeTracked = (id: string) => {
    setTracked((list) => list.filter((t) => t.id !== id));
  };

  const toggleChecklistItem = (trackedId: string, checklistId: string) => {
    setTracked((list) =>
      list.map((t) =>
        t.id === trackedId
          ? { ...t, checklist: t.checklist.map((c) => (c.id === checklistId ? { ...c, done: !c.done } : c)) }
          : t
      )
    );
  };

  const updateProjectDescription = (id: string, projectDescription: string) => {
    setTracked((list) => list.map((t) => (t.id === id ? { ...t, projectDescription } : t)));
  };

  const updateAiDraft = (id: string, aiDraft: string) => {
    setTracked((list) => list.map((t) => (t.id === id ? { ...t, aiDraft } : t)));
  };

  const tabs: { id: TabId; label: string; icon: typeof FileSearch }[] = [
    { id: "tenders", label: "標案查詢", icon: FileSearch },
    { id: "grants", label: "補助查詢", icon: ClipboardCheck },
    { id: "tracked", label: "我要申請", icon: Bookmark },
    { id: "profile", label: "公司資料", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-white">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">標案補助查詢工具</h1>
              <p className="text-xs text-slate-400">政府標案與補助一站查詢、資格比對</p>
            </div>
            {hasProfile && (
              <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {profile.companyName || "公司資料"} 已建立
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5">
          <div className="flex gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-slate-800 text-slate-800"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {t.id === "profile" && !hasProfile && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                  {t.id === "tracked" && tracked.length > 0 && (
                    <span className="ml-1 rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-600">
                      {tracked.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-5 py-6">
        {tab === "tenders" && <TendersTab profile={profile} hasProfile={hasProfile} />}
        {tab === "grants" && (
          <GrantsTab
            profile={profile}
            hasProfile={hasProfile}
            onGoToProfile={() => setTab("profile")}
            tracked={tracked}
            onToggleTracked={toggleTracked}
          />
        )}
        {tab === "tracked" && (
          <TrackedTab
            tracked={tracked}
            profile={profile}
            onUpdateStatus={updateTrackedStatus}
            onRemove={removeTracked}
            onGoToGrants={() => setTab("grants")}
            onToggleChecklistItem={toggleChecklistItem}
            onUpdateProjectDescription={updateProjectDescription}
            onUpdateAiDraft={updateAiDraft}
          />
        )}
        {tab === "profile" && (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">建立公司資料</h2>
            <ProfileForm profile={profile} setProfile={setProfile} />
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-5 py-6 text-xs text-slate-400">
        標案資料來源：政府電子採購網開放資料（pcc-api.openfun.app）。補助計畫彙整各部會公開資訊。本工具僅供查詢參考，實際申請資格與截止時間請以官方公告為準。
      </footer>
    </div>
  );
}

export default App;
