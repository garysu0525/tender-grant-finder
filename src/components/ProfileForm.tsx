import { AlertCircle } from "lucide-react";
import type { CompanyProfile } from "../types";
import { CERT_OPTIONS, INDUSTRY_OPTIONS, REGION_OPTIONS } from "../data/grants";

interface Props {
  profile: CompanyProfile;
  setProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
}

export function ProfileForm({ profile, setProfile }: Props) {
  const update = (key: keyof CompanyProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleCert = (cert: string) => {
    setProfile((p) => {
      const certs = p.certs || [];
      return {
        ...p,
        certs: certs.includes(cert) ? certs.filter((c) => c !== cert) : [...certs, cert],
      };
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">公司名稱</label>
          <input
            type="text"
            value={profile.companyName || ""}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="例：唯數娛樂股份有限公司"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">成立年份</label>
          <input
            type="number"
            value={profile.foundedYear || ""}
            onChange={(e) => update("foundedYear", e.target.value)}
            placeholder="例：2018"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">資本額（元）</label>
          <input
            type="number"
            value={profile.capital || ""}
            onChange={(e) => update("capital", e.target.value)}
            placeholder="例：3000000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">近 3 年同類型履約件數</label>
          <input
            type="number"
            value={profile.experience ?? ""}
            onChange={(e) => update("experience", e.target.value)}
            placeholder="例：2"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">產業別</label>
          <select
            value={profile.industry || ""}
            onChange={(e) => update("industry", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">請選擇</option>
            {INDUSTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">登記地區</label>
          <select
            value={profile.region || ""}
            onChange={(e) => update("region", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">請選擇</option>
            {REGION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">持有證照／驗證</label>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map((cert) => (
            <button
              key={cert}
              onClick={() => toggleCert(cert)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                (profile.certs || []).includes(cert)
                  ? "border-slate-700 bg-slate-700 text-white"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-slate-400">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        公司資料僅暫存於本次瀏覽器頁面中，重新整理頁面後將會清空，不會上傳或儲存到任何伺服器。
      </p>
    </div>
  );
}
