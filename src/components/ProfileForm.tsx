import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import type { CompanyProfile } from "../types";
import { CERT_OPTIONS, INDUSTRY_OPTIONS, REGION_OPTIONS } from "../data/grants";
import { GcisApiError, importCompanyProfile } from "../lib/gcisApi";

interface Props {
  profile: CompanyProfile;
  setProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
}

export function ProfileForm({ profile, setProfile }: Props) {
  const [taxIdInput, setTaxIdInput] = useState(profile.taxId || "");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedAddress, setImportedAddress] = useState<string | null>(null);
  const [customCertInput, setCustomCertInput] = useState("");

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

  const addCustomCert = () => {
    const cert = customCertInput.trim();
    if (!cert) return;
    setProfile((p) => {
      const certs = p.certs || [];
      return certs.includes(cert) ? p : { ...p, certs: [...certs, cert] };
    });
    setCustomCertInput("");
  };

  const customCerts = (profile.certs || []).filter((c) => !CERT_OPTIONS.includes(c));

  const runImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportedAddress(null);
    try {
      const info = await importCompanyProfile(taxIdInput);
      setProfile((p) => ({
        ...p,
        taxId: taxIdInput.trim(),
        companyName: info.companyName,
        foundedYear: info.foundedYear || p.foundedYear,
        capital: info.capital || p.capital,
        region: info.region || p.region,
        businessCodes: info.businessCodes,
      }));
      setImportedAddress(info.rawAddress);
    } catch (e) {
      setImportError(e instanceof GcisApiError ? e.message : "自動帶入失敗，請手動填寫");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          統一編號（從經濟部商工登記資料自動帶入）
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={taxIdInput}
            onChange={(e) => setTaxIdInput(e.target.value)}
            placeholder="例：22099131"
            maxLength={8}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            onClick={runImport}
            disabled={importing || taxIdInput.trim().length !== 8}
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            自動帶入
          </button>
        </div>
        {importError && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {importError}
          </p>
        )}
        {importedAddress && !importError && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            已帶入公司名稱／成立年份／資本額／所營事業代碼，登記地址：{importedAddress}（請確認下方「登記地區」是否正確）
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-400">
          僅自動帶入公司名稱、成立年份、資本額、地區、所營事業代碼；產業別、證照、履約件數仍需手動填寫，所有欄位都可手動覆寫。
        </p>
      </div>

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
          {customCerts.map((cert) => (
            <button
              key={cert}
              onClick={() => toggleCert(cert)}
              className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-700 px-3 py-1 text-xs text-white"
            >
              {cert}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customCertInput}
            onChange={(e) => setCustomCertInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCert())}
            placeholder="新增其他證照，例如：ISO14001、CE 認證"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            onClick={addCustomCert}
            disabled={!customCertInput.trim()}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3" />
            新增
          </button>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-slate-400">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        公司資料僅暫存於本次瀏覽器頁面中，重新整理頁面後將會清空，不會上傳或儲存到任何伺服器。
      </p>
    </div>
  );
}
