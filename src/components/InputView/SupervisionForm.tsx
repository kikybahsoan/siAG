import React, { useState, useEffect, useRef } from "react";
import { SchoolMeta, ScoreValue, SectionCategory, SupervisionRecord } from "../../types";
import { saveTeacherRecord } from "../../utils/storage";
import { 
  SECTIONS, 
  SKOR_MAKS, 
  SKOR_MAX_PER_ITEM, 
  SCORE_RUBRIC_DESCRIPTIONS, 
  calculateScoreSummary,
  AUTO_FEEDBACK_TEMPLATES 
} from "../../data/supervisionData";
import { 
  Save, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  FileCheck2, 
  Sparkles, 
  Printer, 
  Check, 
  HelpCircle,
  Clock,
  User,
  BookOpen,
  Award,
  ExternalLink,
  FolderOpen,
  Link as LinkIcon,
  CloudUpload,
  RefreshCw,
  HardDrive
} from "lucide-react";

const formatExternalUrl = (url?: string): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

interface SupervisionFormProps {
  record: SupervisionRecord;
  schoolMeta: SchoolMeta;
  onSave: (record: SupervisionRecord) => Promise<any> | void;
  onPrintTeacher: (record: SupervisionRecord) => void;
}

export const SupervisionForm: React.FC<SupervisionFormProps> = ({
  record: initialRecord,
  schoolMeta,
  onSave,
  onPrintTeacher
}) => {
  const [record, setRecord] = useState<SupervisionRecord>(initialRecord);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    A: true,
    B: true,
    C: false,
    D: false
  });
  const [openBukti, setOpenBukti] = useState<Record<number, boolean>>({});
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Tracks the active teacher to ensure user inputs are NEVER wiped by re-renders or background syncs
  const currentTeacherRef = useRef<string>(initialRecord.name);

  // Sync state ONLY when the selected teacher actually changes
  useEffect(() => {
    if (initialRecord.name !== currentTeacherRef.current) {
      currentTeacherRef.current = initialRecord.name;
      setRecord(initialRecord);
      setSavedSuccess(false);
      setSaveMessage(null);
      setIsDraftSaved(false);
    }
  }, [initialRecord.name]);

  // Real-time Local Auto-Save (Drafting):
  // Menjaga agar saat guru/supervisor mengetik atau memilih nilai, data tersimpan langsung di perangkat lokal (Anti-Hilang)
  useEffect(() => {
    if (!record || record.name !== currentTeacherRef.current) return;

    const timer = setTimeout(() => {
      saveTeacherRecord(record);
      setIsDraftSaved(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [record]);

  const summary = calculateScoreSummary(record);

  const handleScoreChange = (itemNo: number, score: ScoreValue) => {
    const currentScore = record.scores[itemNo];
    const newScore = currentScore === score ? null : score;
    setRecord((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [itemNo]: newScore
      }
    }));
  };

  const handleFieldChange = (field: keyof SupervisionRecord, value: any) => {
    setRecord((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleBukti = (itemNo: number) => {
    setOpenBukti((prev) => ({
      ...prev,
      [itemNo]: !prev[itemNo]
    }));
  };

  const handleSetAllScores = (value: ScoreValue) => {
    const newScores: Record<number, ScoreValue> = {};
    SECTIONS.forEach((sec) => {
      sec.items.forEach((it) => {
        newScores[it.no] = value;
      });
    });
    setRecord((prev) => ({
      ...prev,
      scores: newScores
    }));
  };

  const handleApplyAutoFeedback = () => {
    const pct = summary.percentage || 0;
    const template = AUTO_FEEDBACK_TEMPLATES.find((t) => pct >= t.minPct) || AUTO_FEEDBACK_TEMPLATES[AUTO_FEEDBACK_TEMPLATES.length - 1];

    setRecord((prev) => ({
      ...prev,
      catatan: template.catatan,
      tindakLanjut: template.tindakLanjut
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // 1. Simpan langsung ke memori lokal browser
      saveTeacherRecord(record);
      setSavedSuccess(true);

      // 2. Kirim ke Google Spreadsheet (Push)
      const res = await onSave(record);
      if (res && res.cloudSuccess) {
        setSaveMessage("Tersimpan di perangkat dan terkirim ke Google Spreadsheet!");
      } else if (res && res.message) {
        setSaveMessage(res.message);
      } else {
        setSaveMessage("Data tersimpan aman di perangkat lokal.");
      }
    } catch (err: any) {
      console.warn("Form save error:", err);
      setSaveMessage("Tersimpan di perangkat lokal.");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 4000);
    }
  };

  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = summary.percentage !== null
    ? circumference * (1 - summary.percentage / 100)
    : circumference;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-5 sm:p-7 relative overflow-hidden">
      {/* Decorative ambient gradient inside form */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Top Header Bento Card */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-neutral-800">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Instrumen Administrasi
              </span>
              {isDraftSaved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span>Draft tersimpan di perangkat</span>
                </span>
              )}
              {record.driveUrl && (
                <a
                  href={formatExternalUrl(record.driveUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors shadow-sm"
                  title="Klik untuk membuka soft copy Google Drive guru di tab baru"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                  <span>Buka Soft Copy (Drive)</span>
                </a>
              )}
              {record.updatedAt && (
                <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span>Tersimpan: {new Date(record.updatedAt).toLocaleDateString("id-ID")}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight leading-tight uppercase">
              {record.name.toUpperCase()}
            </h2>
            <p className="text-xs text-neutral-400">
              19 Indikator Evaluasi Bukti Otentik Kurikulum Merdeka &bull; Skor Maksimal 76
            </p>
          </div>

          {/* Bento Score Gauge / Ring */}
          <div className="flex items-center gap-4 bg-neutral-950/70 border border-neutral-800/80 p-4 rounded-2xl self-stretch lg:self-auto justify-between sm:justify-start shadow-inner">
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-neutral-800 fill-none"
                  strokeWidth="7"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-indigo-500 fill-none transition-all duration-500"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-lg font-bold text-white leading-none">
                  {summary.percentage !== null ? `${Math.round(summary.percentage)}%` : "–"}
                </span>
                <span className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5 tracking-wider">Capaian</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-white">{summary.total}</span>
                <span className="text-xs font-mono text-neutral-500">/ {SKOR_MAKS} Skor</span>
              </div>

              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${summary.predikat.bgClass} ${summary.predikat.borderClass}`}>
                  {summary.predikat.label} {summary.predikat.grade !== "-" ? `(${summary.predikat.grade})` : ""}
                </span>
              </div>

              <div className="text-[11px] text-neutral-400 font-medium">
                {summary.count} dari 19 indikator dinilai
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Metadata Bento Sub-Grid */}
        <div className="bg-neutral-950/60 p-4 sm:p-5 rounded-2xl border border-neutral-800 space-y-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Identitas Guru & Tugas Mengajar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Mata Pelajaran yang Diampu *
              </label>
              <input
                type="text"
                value={record.mapel}
                onChange={(e) => handleFieldChange("mapel", e.target.value)}
                placeholder="Contoh: Bahasa Indonesia / Fisika"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Kelas / Fase yang Diajar
              </label>
              <input
                type="text"
                value={record.kelas}
                onChange={(e) => handleFieldChange("kelas", e.target.value)}
                placeholder="Contoh: X.1 - X.4 / Fase E"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Jumlah Jam Tatap Muka (JTM)
              </label>
              <input
                type="text"
                value={record.jtm}
                onChange={(e) => handleFieldChange("jtm", e.target.value)}
                placeholder="Contoh: 24 Jam"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Tugas Tambahan
              </label>
              <input
                type="text"
                value={record.tugasTambahan}
                onChange={(e) => handleFieldChange("tugasTambahan", e.target.value)}
                placeholder="Contoh: Wali Kelas / Pembina OSIS / Koordinator P5"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Sertifikasi Mapel / Tahun
              </label>
              <input
                type="text"
                value={record.sertifikasi}
                onChange={(e) => handleFieldChange("sertifikasi", e.target.value)}
                placeholder="Contoh: Bahasa Indonesia / 2019"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                NIP / NUPTK Guru
              </label>
              <input
                type="text"
                value={record.nip || ""}
                onChange={(e) => handleFieldChange("nip", e.target.value)}
                placeholder="Contoh: 19850101 201001 1 005"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Link Google Drive Soft Copy Perangkat Pembelajaran */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 pt-2.5 mt-1 border-t border-neutral-800/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Link Google Drive (Soft Copy Perangkat Pembelajaran)</span>
                </label>
                {record.driveUrl && (
                  <span className="text-[10.5px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Tautan soft copy siap ditinjau</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={record.driveUrl || ""}
                    onChange={(e) => handleFieldChange("driveUrl", e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/... atau link file RPP/Modul Ajar"
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                {record.driveUrl ? (
                  <a
                    href={formatExternalUrl(record.driveUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex-shrink-0"
                    title="Buka folder/file Google Drive di tab browser baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Soft Copy</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 text-neutral-500 rounded-xl text-xs font-medium cursor-not-allowed flex-shrink-0 border border-neutral-800"
                    title="Masukkan link Google Drive untuk mengaktifkan tombol ini"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Soft Copy</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Tautan folder atau berkas soft copy perangkat pembelajaran guru (Modul Ajar/RPP, Prota, Promes, Alur Tujuan Pembelajaran, LKPD, Instrumen Penilaian) untuk memudahkan verifikasi dokumen oleh supervisor.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Scoring Bento Helper Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pengisian Cepat:</span>
            <button
              type="button"
              onClick={() => handleSetAllScores(4)}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg transition-all"
            >
              Semua 4 (Amat Baik)
            </button>
            <button
              type="button"
              onClick={() => handleSetAllScores(3)}
              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-lg transition-all"
            >
              Semua 3 (Baik)
            </button>
            <button
              type="button"
              onClick={() => handleSetAllScores(null)}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-400 border border-neutral-700 text-xs font-semibold rounded-lg transition-all"
            >
              Reset / Kosongkan
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const allOpen: Record<number, boolean> = {};
                SECTIONS.forEach(s => s.items.forEach(it => { allOpen[it.no] = true; }));
                setOpenBukti(allOpen);
              }}
              className="text-xs text-neutral-400 hover:text-indigo-400 transition-colors"
            >
              Buka Semua Bukti
            </button>
            <span className="text-neutral-700">&bull;</span>
            <button
              type="button"
              onClick={() => setOpenBukti({})}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Tutup Bukti
            </button>
            <span className="text-neutral-700">&bull;</span>
            <button
              type="button"
              onClick={() => setShowRubricModal(!showRubricModal)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Rubrik Skala 0-4</span>
            </button>
          </div>
        </div>

        {/* Rubric Guide Bento Card */}
        {showRubricModal && (
          <div className="bg-neutral-950 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-3 text-xs animate-in fade-in duration-200">
            <div className="font-bold text-amber-400 flex items-center justify-between uppercase tracking-wider text-xs">
              <span>Panduan Skala Penilaian Bukti Otentik (0 - 4):</span>
              <button
                type="button"
                onClick={() => setShowRubricModal(false)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <div key={s} className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                  <div className="font-mono font-bold text-indigo-400 text-sm mb-1">
                    Skor {s}: {SCORE_RUBRIC_DESCRIPTIONS[s].title}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {SCORE_RUBRIC_DESCRIPTIONS[s].desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accordion Bento Sections A, B, C, D */}
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const isOpen = !!openSections[section.id];
            const secInfo = summary.sectionBreakdown.find((b) => b.id === section.id);
            const filledCount = section.items.filter((it) => record.scores[it.no] !== null).length;

            return (
              <div
                key={section.id}
                className="border border-neutral-800 rounded-3xl overflow-hidden bg-neutral-950/40 shadow-md"
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-neutral-900 hover:bg-neutral-850 border-b border-neutral-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/30">
                      {section.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-neutral-100">
                        {section.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-medium">
                        {section.items.length} Indikator &bull; Terisi {filledCount}/{section.items.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {secInfo?.total || 0} / {secInfo?.max || 0}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Section Body */}
                {isOpen && (
                  <div className="p-4 sm:p-5 space-y-3 bg-neutral-950/60 divide-y divide-neutral-800/60">
                    {section.items.map((item) => {
                      const currentVal = record.scores[item.no];
                      const isBuktiOpen = !!openBukti[item.no];

                      return (
                        <div key={item.no} className="pt-3.5 first:pt-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 bg-neutral-900/80 p-3.5 sm:p-4 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all">
                            {/* Indicator Details & Authentic Evidence */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono text-xs font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-lg flex-shrink-0">
                                  {item.no}
                                </span>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-semibold text-neutral-100 leading-snug">
                                    {item.nama}
                                  </h4>

                                  {/* Evidence toggle button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleBukti(item.no)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5 font-semibold inline-flex items-center gap-1 transition-colors"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    <span>
                                      {isBuktiOpen ? "Sembunyikan kriteria bukti fisik" : "Lihat kriteria bukti fisik otentik"}
                                    </span>
                                  </button>

                                  {/* Evidence List */}
                                  {isBuktiOpen && (
                                    <div className="mt-2.5 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1.5 animate-in fade-in duration-150">
                                      <div className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">
                                        Daftar Bukti Fisik / Otentik yang Diverifikasi:
                                      </div>
                                      <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px] pl-1">
                                        {item.bukti.map((b, bIdx) => (
                                          <li key={bIdx} className="leading-relaxed">
                                            {b}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Score 0 - 4 selector Bento buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                              {[0, 1, 2, 3, 4].map((score) => {
                                const isSelected = currentVal === score;
                                return (
                                  <button
                                    key={score}
                                    type="button"
                                    onClick={() => handleScoreChange(item.no, score as ScoreValue)}
                                    title={`Skor ${score}: ${SCORE_RUBRIC_DESCRIPTIONS[score].title}`}
                                    className={`w-8 h-8 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105"
                                        : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800"
                                    }`}
                                  >
                                    {score}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Headmaster / Supervisor Feedback Bento Card */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm sm:text-base text-neutral-100">
                Catatan Supervisi & Rekomendasi Tindak Lanjut
              </h3>
            </div>

            <button
              type="button"
              onClick={handleApplyAutoFeedback}
              className="text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
              title="Isi otomatis catatan berdasarkan hasil nilai"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saran Otomatis (Rekomendasi)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Catatan Hasil Supervisi Administrasi
              </label>
              <textarea
                value={record.catatan}
                onChange={(e) => handleFieldChange("catatan", e.target.value)}
                rows={4}
                placeholder="Tuliskan apresiasi, temuan kelebihan dan kekurangan administrasi pembelajaran guru..."
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-2xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 leading-relaxed transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Rencana Tindak Lanjut / Pendampingan
              </label>
              <textarea
                value={record.tindakLanjut}
                onChange={(e) => handleFieldChange("tindakLanjut", e.target.value)}
                rows={4}
                placeholder="Rencana tindak lanjut (misal: pembinaan berkala, pendampingan Kombel, workshop kurikulum, atau pengimbasan praktik baik)..."
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-2xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 leading-relaxed transition-colors"
              />
            </div>
          </div>

          {/* Supervisor Signature Meta Bento Sub-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Nama Kepala Sekolah / Supervisor
              </label>
              <input
                type="text"
                value={record.namaSupervisor || schoolMeta.kepalaSekolah}
                onChange={(e) => handleFieldChange("namaSupervisor", e.target.value)}
                placeholder="Nama Lengkap & Gelar"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                NIP Kepala Sekolah / Supervisor
              </label>
              <input
                type="text"
                value={record.nipSupervisor || schoolMeta.nipKepalaSekolah}
                onChange={(e) => handleFieldChange("nipSupervisor", e.target.value)}
                placeholder="19720415 199802 1 002"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                Tanggal Pelaksanaan Supervisi
              </label>
              <input
                type="date"
                value={record.tanggal}
                onChange={(e) => handleFieldChange("tanggal", e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bento Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all ${
                isSaving 
                  ? "bg-indigo-700 cursor-wait opacity-80" 
                  : savedSuccess 
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 active:scale-[0.99]"
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                  <span>Menyimpan & Mengirim ke Cloud...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersimpan & Terkirim!</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Simpan & Kirim ke Spreadsheet</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onPrintTeacher(record)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-700 transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak Lembar</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-neutral-400">
            {saveMessage ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            ) : isDraftSaved ? (
              <span className="text-neutral-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Isian Anda otomatis tersimpan di perangkat ini (Aman).</span>
              </span>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
};
