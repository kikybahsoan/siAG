import React, { useState } from "react";
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { 
  exportAllDataAsJSON, 
  importDataFromJSON, 
  resetAllDataToDefault,
  clearAllSupervisionRecords 
} from "../utils/storage";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `Backup_Supervisi_Guru_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setImportStatus("File cadangan JSON berhasil diunduh.");
    setIsSuccess(true);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const ok = importDataFromJSON(content);
        if (ok) {
          setImportStatus("Data berhasil dipulihkan dari file backup!");
          setIsSuccess(true);
          onDataRestored();
        } else {
          setImportStatus("Format file tidak valid atau rusak.");
          setIsSuccess(false);
        }
      } catch (err) {
        setImportStatus("Gagal membaca file JSON.");
        setIsSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClearScores = () => {
    if (window.confirm("Hapus seluruh nilai dan riwayat supervisi yang ada? (Daftar nama guru akan tetap tersimpan).")) {
      clearAllSupervisionRecords();
      setImportStatus("Semua nilai supervisi berhasil dibersihkan! Status semua guru kembali 'Belum Disupervisi'.");
      setIsSuccess(true);
      onDataRestored();
    }
  };

  const handleReset = () => {
    if (window.confirm("PERINGATAN: Seluruh data supervisi dan perubahan nama guru akan dikembalikan ke kondisi awal. Lanjutkan?")) {
      resetAllDataToDefault();
      setImportStatus("Sistem berhasil direset ke pengaturan awal.");
      setIsSuccess(true);
      onDataRestored();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Decorative ambient blur inside modal */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-100">
                Cadangkan & Pulihkan Data
              </h3>
              <p className="text-[11px] text-neutral-400">Sinkronisasi & Penyimpanan Berkas JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs relative z-10">
          {importStatus && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                isSuccess
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isSuccess ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="font-medium">{importStatus}</span>
            </div>
          )}

          {/* Export section */}
          <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 space-y-2.5">
            <div className="font-bold text-neutral-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>1. Unduh Cadangan Lengkap (JSON)</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Simpan seluruh rekaman nilai 72 guru, catatan supervisi, dan profil sekolah dalam 1 berkas file JSON yang aman di komputer Anda.
            </p>
            <button
              onClick={handleExport}
              className="w-full mt-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Backup (.json)</span>
            </button>
          </div>

          {/* Import section */}
          <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 space-y-2.5">
            <div className="font-bold text-neutral-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>2. Pulihkan / Impor Data dari File</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Pilih file .json cadangan untuk memulihkan seluruh data supervisi sekolah.
            </p>
            <label className="w-full mt-1 py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-indigo-500 text-neutral-200 font-semibold rounded-xl hover:bg-neutral-800 transition-all inline-flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pilih File Backup (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset buttons & footer */}
          <div className="pt-3 border-t border-neutral-800 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearScores}
                className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 text-[11px] font-medium"
                title="Hapus semua nilai supervisi, daftar nama guru tetap ada"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bersihkan Nilai</span>
              </button>

              <button
                onClick={handleReset}
                className="text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1.5 text-[11px] font-medium"
                title="Kembalikan semua ke setelan awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Total</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl border border-neutral-700 transition-all text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
