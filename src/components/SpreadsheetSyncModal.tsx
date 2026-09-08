import React, { useState, useEffect } from "react";
import { 
  X, 
  Cloud, 
  CloudRain,
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Check, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  FileSpreadsheet, 
  HelpCircle, 
  Code2, 
  CheckCircle2,
  Smartphone,
  Laptop
} from "lucide-react";
import { 
  getSyncConfig, 
  saveSyncConfig, 
  testSpreadsheetConnection, 
  pushToSpreadsheet, 
  pullFromSpreadsheet,
  GOOGLE_APPS_SCRIPT_CODE,
  SyncConfig
} from "../utils/spreadsheetSync";

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"sync" | "guide" | "code">("sync");
  const [webAppUrl, setWebAppUrl] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSyncConfig();
      setWebAppUrl(config.webAppUrl);
      setAutoSync(config.autoSync);
      setLastSyncTime(config.lastSyncTime);
      setSpreadsheetUrl(config.spreadsheetUrl || "");
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    if (!webAppUrl.trim()) {
      setStatusMessage({ type: "error", text: "Silakan masukkan URL Web App Google Apps Script." });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Menguji koneksi ke Google Spreadsheet..." });

    const result = await testSpreadsheetConnection(webAppUrl.trim());
    setIsLoading(false);

    if (result.success) {
      saveSyncConfig({
        webAppUrl: webAppUrl.trim(),
        autoSync,
        spreadsheetUrl: result.spreadsheetUrl
      });
      if (result.spreadsheetUrl) setSpreadsheetUrl(result.spreadsheetUrl);
      setStatusMessage({ type: "success", text: result.message });
    } else {
      setStatusMessage({ type: "error", text: result.message });
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Mengirim data supervisi ke Google Spreadsheet..." });

    const res = await pushToSpreadsheet(webAppUrl);
    setIsLoading(false);

    if (res.success) {
      const now = new Date().toISOString();
      setLastSyncTime(now);
      setStatusMessage({ type: "success", text: res.message });
      onSyncCompleted();
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    setStatusMessage({ type: "info", text: "Menarik data supervisi terbaru dari Google Spreadsheet..." });

    const res = await pullFromSpreadsheet(webAppUrl);
    setIsLoading(false);

    if (res.success) {
      const now = new Date().toISOString();
      setLastSyncTime(now);
      setStatusMessage({ type: "success", text: res.message });
      onSyncCompleted();
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    saveSyncConfig({ autoSync: checked });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const formattedLastSync = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "Belum pernah disinkronkan";

  const isConnected = !!webAppUrl && webAppUrl.includes("/exec");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/70 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-neutral-100">
                  Sinkronisasi Database Spreadsheet
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multi-Device
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Akses & sinkronkan data supervisi secara instan dari HP, Laptop, dan Tablet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveSubTab("sync")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeSubTab === "sync"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Koneksi & Sinkron</span>
          </button>

          <button
            onClick={() => setActiveSubTab("guide")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeSubTab === "guide"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Langkah-Langkah Setup</span>
          </button>

          <button
            onClick={() => setActiveSubTab("code")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeSubTab === "code"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kode Apps Script</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          {/* Status Message Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl flex items-start gap-2.5 border animate-in fade-in duration-150 ${
              statusMessage.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
            }`}>
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              )}
              <p className="leading-relaxed text-xs">{statusMessage.text}</p>
            </div>
          )}

          {/* TAB 1: SINKRONISASI & KONEKSI */}
          {activeSubTab === "sync" && (
            <div className="space-y-4">
              {/* Connection Status Box */}
              <div className="p-4 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Status Database:</span>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Terhubung ke Cloud
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-medium text-[11px]">
                        Belum Dikonfigurasi
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    Terakhir Sinkron: <span className="font-mono text-neutral-300">{formattedLastSync}</span>
                  </div>
                </div>

                {/* Input Web App URL */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-neutral-200">
                    URL Aplikasi Web (Google Apps Script)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      onClick={handleSaveAndTest}
                      disabled={isLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Uji & Simpan</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Dapatkan URL ini dengan mengikuti panduan di tab <strong>Langkah-Langkah Setup</strong> di atas.
                  </p>
                </div>

                {/* Direct Google Sheet Link if available */}
                {spreadsheetUrl && (
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Buka berkas di Google Drive:</span>
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <span>Buka Google Spreadsheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons: Push & Pull */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pull from Cloud */}
                <div className="p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-2">
                  <div className="flex items-center gap-2 font-bold text-neutral-100">
                    <DownloadCloud className="w-4 h-4 text-indigo-400" />
                    <span>Tarik Data dari Spreadsheet</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Ambil data penilaian terbaru dari Google Spreadsheet ke perangkat ini (cocok saat baru membuka di HP atau laptop lain).
                  </p>
                  <button
                    onClick={handlePull}
                    disabled={isLoading || !isConnected}
                    className="w-full mt-2 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-100 font-semibold rounded-xl border border-neutral-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>Tarik Data Terbaru (Pull)</span>
                  </button>
                </div>

                {/* Push to Cloud */}
                <div className="p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-2">
                  <div className="flex items-center gap-2 font-bold text-neutral-100">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Kirim Data ke Spreadsheet</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Unggah seluruh data supervisi dan rincian 19 indikator saat ini ke Google Spreadsheet agar bisa dilihat perangkat lain.
                  </p>
                  <button
                    onClick={handlePush}
                    disabled={isLoading || !isConnected}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>Kirim Data ke Cloud (Push)</span>
                  </button>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3">
                 <div>
                  <div className="font-semibold text-neutral-200 flex items-center gap-2">
                    <span>Otomatis Sinkron Setiap 1 Jam (Auto-Sync)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Interval 1 Jam
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Aplikasi menyinkronkan data di latar belakang setiap 1 jam secara berkala serta saat Anda menekan tombol "Simpan Penilaian", sehingga proses pengisian instrumen tidak akan terganggu.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Multi-Device Info Banner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-300 text-[11px]">
                <div className="flex gap-1 items-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <Laptop className="w-4 h-4 text-emerald-400" />
                </div>
                <p>
                  <strong>Sinkronisasi Otomatis 1 Jam Aktif:</strong> URL Google Apps Script Anda telah disematkan secara default. Data tersinkronkan otomatis setiap 1 jam dan saat menekan "Simpan Penilaian" tanpa risiko form ter-reset saat sedang diisi.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN LANGKAH-LANGKAH SETUP */}
          {activeSubTab === "guide" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    1
                  </span>
                  Buat Google Spreadsheet Baru
                </h4>
                <p className="text-neutral-400 leading-relaxed pl-7">
                  Buka <strong>Google Drive</strong> (<a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">drive.google.com</a>) dengan akun Google Anda, lalu buat <strong>Google Spreadsheet Baru</strong>. Beri nama file, misalnya: <span className="text-neutral-200 font-mono bg-neutral-900 px-1.5 py-0.5 rounded">Database Supervisi SMKN 2 Gorontalo</span>.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  Buka Apps Script
                </h4>
                <p className="text-neutral-400 leading-relaxed pl-7">
                  Di Google Spreadsheet tersebut, klik menu di atas: <strong>Ekstensi</strong> (Extensions) &rarr; <strong>Apps Script</strong>. Tab baru editor skrip akan terbuka.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pl-7">
                  <h4 className="font-bold text-sm text-neutral-100 -ml-7 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      3
                    </span>
                    Salin & Tempel Kode Script
                  </h4>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Tersalin!" : "Salin Kode"}</span>
                  </button>
                </div>
                <p className="text-neutral-400 leading-relaxed pl-7">
                  Hapus semua kode bawaan (seperti <code className="text-neutral-300 font-mono">function myFunction()</code>) di dalam file <code className="text-neutral-300 font-mono">Code.gs</code>. Lalu tempelkan (Paste) kode lengkap yang ada di tab <strong>Kode Apps Script</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    4
                  </span>
                  Terapkan (Deploy) Sebagai Aplikasi Web
                </h4>
                <div className="text-neutral-400 leading-relaxed pl-7 space-y-2">
                  <p>
                    Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas &rarr; pilih <strong>Penerapan baru (New deployment)</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-neutral-300">
                    <li>Klik ikon gerigi &rarr; pilih <strong>Aplikasi Web (Web app)</strong>.</li>
                    <li>Deskripsi: <span className="text-neutral-100 font-mono">API Supervisi</span></li>
                    <li>Jalankan sebagai: <strong>Saya (email Anda)</strong></li>
                    <li>
                      Siapa yang memiliki akses: <strong className="text-emerald-400">Siapa saja (Anyone)</strong> *(Sangat penting agar HP/Laptop lain bisa tersinkron tanpa login berkali-kali)*.
                    </li>
                  </ul>
                  <p>
                    Klik tombol <strong>Terapkan (Deploy)</strong>. Jika muncul dialog izin akun Google: klik <em>Beri Akses (Review Permissions)</em> &rarr; Pilih Akun Anda &rarr; Klik <em>Lanjutan (Advanced)</em> &rarr; Klik <em>Buka Untitled project (tidak aman)</em> &rarr; Klik <em>Izinkan (Allow)</em>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    5
                  </span>
                  Salin URL Web App ke Aplikasi Ini
                </h4>
                <p className="text-neutral-400 leading-relaxed pl-7">
                  Salin <strong>URL Aplikasi Web</strong> yang dihasilkan (alamat yang berakhiran <code className="text-emerald-400 font-mono">/exec</code>). Kembali ke tab <strong>Koneksi & Sinkron</strong> di aplikasi ini, tempel pada kolom URL, lalu klik tombol <strong>Uji & Simpan</strong>. Selesai!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: KODE APPS SCRIPT LENGKAP */}
          {activeSubTab === "code" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-neutral-400">
                  Salin kode di bawah ini, lalu tempelkan di Google Apps Script (file <code className="text-neutral-200 font-mono">Code.gs</code>):
                </p>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all flex-shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Kode Tersalin ke Clipboard!" : "Salin Semua Kode"}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span>Database Cloud Google Spreadsheet &bull; SMKN 2 Gorontalo</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
