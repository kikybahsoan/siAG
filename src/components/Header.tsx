import React, { useState } from "react";
import { ActiveTab, SchoolMeta } from "../types";
import { 
  Building2, 
  Calendar, 
  FileText, 
  BarChart3, 
  Printer, 
  TrendingUp, 
  Settings2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Database,
  Cloud,
  Lock
} from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  schoolMeta: SchoolMeta;
  onUpdateSchoolMeta: (meta: SchoolMeta) => void;
  onOpenBackupModal: () => void;
  onOpenSyncModal: () => void;
  isSyncConnected?: boolean;
  totalTeachers: number;
  completedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  schoolMeta,
  onUpdateSchoolMeta,
  onOpenBackupModal,
  onOpenSyncModal,
  isSyncConnected = false,
  totalTeachers,
  completedCount
}) => {
  const [isEditingMeta, setIsEditingMeta] = useState(false);

  const handleFieldChange = (field: keyof SchoolMeta, value: string) => {
    onUpdateSchoolMeta({
      ...schoolMeta,
      [field]: value
    });
  };

  const completionPct = totalTeachers > 0 ? Math.round((completedCount / totalTeachers) * 100) : 0;

  return (
    <header className="no-print bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl mb-6 relative overflow-hidden">
      {/* Decorative ambient gradient inside Bento header */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-600/15 blur-[90px] rounded-full pointer-events-none" />

      <div className="p-5 sm:p-6 relative z-10">
        {/* Top Header info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-neutral-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-500/20 uppercase tracking-widest">
                  Kurikulum Merdeka
                </span>
                <span className="text-[10px] font-mono text-neutral-500">v2.5</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight leading-tight mt-1">
                Supervisi Administrasi Guru
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5 font-normal">
                Platform Evaluasi & Verifikasi Bukti Fisik Perangkat Pembelajaran
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 self-stretch md:self-auto justify-end">
            {/* Progress Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-800/90 border border-neutral-700/60 text-xs font-medium text-neutral-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-neutral-300">
                <strong className="text-white font-bold">{completedCount}</strong> / {totalTeachers} Selesai
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                {completionPct}%
              </span>
            </div>

            {/* School Info Toggle */}
            <button
              onClick={() => setIsEditingMeta(!isEditingMeta)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isEditingMeta
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : "bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 border-neutral-700/80"
              }`}
              title="Ubah info sekolah & kepala sekolah"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isEditingMeta ? "Tutup Info" : "Info Sekolah"}</span>
            </button>

            {/* Cloud Spreadsheet Sync Button (Locked with password) */}
            <button
              onClick={onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSyncConnected
                  ? "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950"
                  : "bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 border-neutral-700/80"
              }`}
              title="Sinkronisasi Cloud Database Spreadsheet (Terkunci Password Admin)"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncConnected ? "text-emerald-400" : "text-neutral-400"}`} />
              <span>Sinkron Spreadsheet</span>
              {isSyncConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <Lock className="w-2.5 h-2.5 text-neutral-400 ml-0.5 opacity-70" />
            </button>

            {/* Backup & Restore Button (Locked with password) */}
            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 border border-neutral-700/80 transition-all"
              title="Cadangkan atau Pulihkan Data (Terkunci Password Admin)"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backup / JSON</span>
              <Lock className="w-2.5 h-2.5 text-neutral-400 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* School Metadata Bento Sub-Grid */}
        <div className={`mt-4 transition-all duration-200 ${isEditingMeta ? "bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800 mb-4" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Satuan Pendidikan
              </span>
              {isEditingMeta ? (
                <input
                  type="text"
                  value={schoolMeta.sekolah}
                  onChange={(e) => handleFieldChange("sekolah", e.target.value)}
                  placeholder="Contoh: SMA Negeri 1 Gorontalo"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="font-semibold text-sm text-neutral-100 truncate">
                  {schoolMeta.sekolah || "(Belum diatur)"}
                </div>
              )}
            </div>

            <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Semester & Tahun
              </span>
              {isEditingMeta ? (
                <div className="flex gap-2">
                  <select
                    value={schoolMeta.semester}
                    onChange={(e) => handleFieldChange("semester", e.target.value)}
                    className="w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                  <input
                    type="text"
                    value={schoolMeta.tahun}
                    onChange={(e) => handleFieldChange("tahun", e.target.value)}
                    placeholder="2026/2027"
                    className="w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div className="text-xs text-neutral-300 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Semester {schoolMeta.semester} &bull; T.P. {schoolMeta.tahun}</span>
                </div>
              )}
            </div>

            <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Kepala Sekolah / Supervisor
              </span>
              {isEditingMeta ? (
                <input
                  type="text"
                  value={schoolMeta.kepalaSekolah}
                  onChange={(e) => handleFieldChange("kepalaSekolah", e.target.value)}
                  placeholder="Nama Lengkap & Gelar"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="text-xs text-neutral-200 font-semibold truncate">
                  {schoolMeta.kepalaSekolah || "-"}
                </div>
              )}
            </div>

            <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Kota Satuan Pendidikan
              </span>
              {isEditingMeta ? (
                <input
                  type="text"
                  value={schoolMeta.kota}
                  onChange={(e) => handleFieldChange("kota", e.target.value)}
                  placeholder="Contoh: Gorontalo"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="text-xs text-neutral-400 font-medium">
                  {schoolMeta.kota || "Indonesia"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bento Nav Tabs Bar */}
        <nav className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800/80 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => onTabChange("input")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "input"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-neutral-950/60 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800/80"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Input Supervisi</span>
          </button>

          <button
            onClick={() => onTabChange("rekap")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "rekap"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-neutral-950/60 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800/80"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rekap Sekolah</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">
              {totalTeachers}
            </span>
          </button>

          <button
            onClick={() => onTabChange("print")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "print"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-neutral-950/60 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800/80"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Lembar Instrumen</span>
          </button>

          <button
            onClick={() => onTabChange("analisis")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === "analisis"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-neutral-950/60 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800/80"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analisis 19 Indikator</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
