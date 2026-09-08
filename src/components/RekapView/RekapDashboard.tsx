import React, { useState, useMemo } from "react";
import { SchoolMeta, SupervisionIndex } from "../../types";
import { SKOR_MAKS, getPredikat, slugifyTeacher } from "../../data/supervisionData";
import { getTeacherRecord } from "../../utils/storage";
import { exportRekapToCSV, exportDetailedReportToCSV } from "../../utils/exportUtils";
import { 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Award,
  AlertCircle
} from "lucide-react";

interface RekapDashboardProps {
  teachers: string[];
  index: SupervisionIndex;
  schoolMeta: SchoolMeta;
  onSelectTeacherForEdit: (name: string) => void;
  onSelectTeacherForPrint: (name: string) => void;
  onDeleteRecord: (name: string) => void;
}

export const RekapDashboard: React.FC<RekapDashboardProps> = ({
  teachers,
  index,
  schoolMeta,
  onSelectTeacherForEdit,
  onSelectTeacherForPrint,
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPredikat, setFilterPredikat] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"no" | "name" | "score" | "date" | "mapel">("no");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Compile full row items
  const fullRows = useMemo(() => {
    return teachers.map((teacher, originalIdx) => {
      const slug = slugifyTeacher(teacher);
      const entry = index[slug];
      const rec = getTeacherRecord(teacher, schoolMeta);

      const hasRecord = !!entry && entry.total !== null;
      const total = entry?.total ?? null;
      const percentage = entry?.percentage ?? (total !== null ? (total / SKOR_MAKS) * 100 : null);
      const pred = getPredikat(percentage);

      return {
        originalIdx: originalIdx + 1,
        name: teacher,
        nip: rec.nip || "-",
        mapel: rec.mapel || "-",
        kelas: rec.kelas || "-",
        total,
        percentage,
        predikat: pred,
        hasRecord,
        updatedAt: entry?.updatedAt || rec.updatedAt || null,
        tanggal: rec.tanggal || "-"
      };
    });
  }, [teachers, index, schoolMeta]);

  // Statistics
  const stats = useMemo(() => {
    const supervisedRows = fullRows.filter((r) => r.hasRecord && r.percentage !== null);
    const totalSupervised = supervisedRows.length;
    const avgScore = totalSupervised > 0
      ? supervisedRows.reduce((sum, r) => sum + (r.total || 0), 0) / totalSupervised
      : 0;
    const avgPct = totalSupervised > 0
      ? supervisedRows.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalSupervised
      : 0;

    const counts = { ab: 0, b: 0, c: 0, k: 0, z: teachers.length - totalSupervised };
    supervisedRows.forEach((r) => {
      if (counts[r.predikat.cls] !== undefined) {
        counts[r.predikat.cls]++;
      }
    });

    return {
      totalSupervised,
      totalTeachers: teachers.length,
      avgScore: Math.round(avgScore * 10) / 10,
      avgPct: Math.round(avgPct * 10) / 10,
      avgPredikat: getPredikat(totalSupervised > 0 ? avgPct : null),
      counts
    };
  }, [fullRows, teachers.length]);

  // Filtered and sorted rows
  const processedRows = useMemo(() => {
    return fullRows
      .filter((row) => {
        const matchesSearch =
          row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.nip.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterPredikat === "all") return true;
        if (filterPredikat === "supervised") return row.hasRecord;
        if (filterPredikat === "unsupervised") return !row.hasRecord;
        return row.predikat.cls === filterPredikat;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "no") {
          cmp = a.originalIdx - b.originalIdx;
        } else if (sortKey === "name") {
          cmp = a.name.localeCompare(b.name);
        } else if (sortKey === "mapel") {
          cmp = a.mapel.localeCompare(b.mapel);
        } else if (sortKey === "score") {
          const scoreA = a.total ?? -1;
          const scoreB = b.total ?? -1;
          cmp = scoreA - scoreB;
        } else if (sortKey === "date") {
          const dateA = a.updatedAt || "";
          const dateB = b.updatedAt || "";
          cmp = dateA.localeCompare(dateB);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [fullRows, searchTerm, filterPredikat, sortKey, sortAsc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const distBase = stats.totalSupervised || 1;

  return (
    <div className="space-y-6">
      {/* Top Stat Summary KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Guru Disupervisi */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Progress Supervisi</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">
                {stats.totalSupervised}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                / {stats.totalTeachers} Guru ({Math.round((stats.totalSupervised / (stats.totalTeachers || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-neutral-950 rounded-full h-2 mt-3 overflow-hidden border border-neutral-800/80">
              <div
                className="bg-indigo-500 h-full transition-all duration-500 rounded-full shadow-sm shadow-indigo-500/50"
                style={{ width: `${(stats.totalSupervised / (stats.totalTeachers || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Rata-Rata Capaian Sekolah */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Rata-Rata Sekolah</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white">
                {stats.totalSupervised > 0 ? `${stats.avgPct}%` : "–"}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({stats.avgScore} / {SKOR_MAKS} Skor)
              </span>
            </div>
            <div className="mt-3">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${stats.avgPredikat.bgClass} ${stats.avgPredikat.borderClass}`}>
                {stats.avgPredikat.label} {stats.avgPredikat.grade !== "-" ? `(${stats.avgPredikat.grade})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Predikat Baik & Amat Baik */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Amat Baik & Baik</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold">
              A + B
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400">
                {stats.counts.ab + stats.counts.b}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Guru ({stats.totalSupervised > 0 ? Math.round(((stats.counts.ab + stats.counts.b) / stats.totalSupervised) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-3 flex gap-4 font-mono">
              <span>Amat Baik: <b className="text-neutral-200">{stats.counts.ab}</b></span>
              <span>Baik: <b className="text-neutral-200">{stats.counts.b}</b></span>
            </div>
          </div>
        </div>

        {/* Card 4: Distribusi Predikat Cukup & Kurang */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Perlu Pendampingan</span>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg font-bold">
              C + D
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-rose-400">
                {stats.counts.c + stats.counts.k}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Guru ({stats.totalSupervised > 0 ? Math.round(((stats.counts.c + stats.counts.k) / stats.totalSupervised) * 100) : 0}%)
              </span>
            </div>

            {/* Proportional color bar */}
            <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-neutral-950 border border-neutral-800">
              <div
                style={{ width: `${(stats.counts.ab / distBase) * 100}%` }}
                className="bg-emerald-500"
                title={`Amat Baik: ${stats.counts.ab}`}
              />
              <div
                style={{ width: `${(stats.counts.b / distBase) * 100}%` }}
                className="bg-indigo-500"
                title={`Baik: ${stats.counts.b}`}
              />
              <div
                style={{ width: `${(stats.counts.c / distBase) * 100}%` }}
                className="bg-amber-500"
                title={`Cukup: ${stats.counts.c}`}
              />
              <div
                style={{ width: `${(stats.counts.k / distBase) * 100}%` }}
                className="bg-rose-500"
                title={`Kurang: ${stats.counts.k}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Toolbar Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama guru, mata pelajaran, atau NIP..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter dropdown and action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-1.5 text-xs text-neutral-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Filter:</label>
              <select
                value={filterPredikat}
                onChange={(e) => setFilterPredikat(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="all" className="bg-neutral-900 text-neutral-200">Semua Guru ({teachers.length})</option>
                <option value="supervised" className="bg-neutral-900 text-neutral-200">Sudah Disupervisi ({stats.totalSupervised})</option>
                <option value="unsupervised" className="bg-neutral-900 text-neutral-200">Belum Disupervisi ({stats.counts.z})</option>
                <option value="ab" className="bg-neutral-900 text-neutral-200">Amat Baik (A) - {stats.counts.ab}</option>
                <option value="b" className="bg-neutral-900 text-neutral-200">Baik (B) - {stats.counts.b}</option>
                <option value="c" className="bg-neutral-900 text-neutral-200">Cukup (C) - {stats.counts.c}</option>
                <option value="k" className="bg-neutral-900 text-neutral-200">Kurang (D) - {stats.counts.k}</option>
              </select>
            </div>

            {/* Export Buttons */}
            <button
              onClick={() => exportRekapToCSV(teachers, index, schoolMeta)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
              title="Unduh Rekap Nilai ke format CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel (CSV)</span>
            </button>

            <button
              onClick={() => exportDetailedReportToCSV(teachers, schoolMeta)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-2xl border border-neutral-700 transition-all"
              title="Unduh Matriks Rincian Nilai 19 Indikator per Guru"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Matriks 19 Indikator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table in Bento Frame */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold text-[10px] tracking-wider font-mono">
                <th
                  onClick={() => handleSort("no")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-center w-14"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>No</span>
                    {sortKey === "no" && (sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Guru</span>
                    {sortKey === "name" && (sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("mapel")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Mata Pelajaran</span>
                    {sortKey === "mapel" && (sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("score")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-center w-24"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Skor</span>
                    {sortKey === "score" && (sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4 w-32">
                  <span>Capaian</span>
                </th>
                <th className="py-3.5 px-4 w-36 text-center">
                  <span>Predikat</span>
                </th>
                <th
                  onClick={() => handleSort("date")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-center w-32"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Diperbarui</span>
                    {sortKey === "date" && (sortAsc ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />)}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right w-36">
                  <span>Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-neutral-500">
                    Tidak ada data guru yang memenuhi filter.
                  </td>
                </tr>
              ) : (
                processedRows.map((row) => {
                  return (
                    <tr
                      key={row.name}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-neutral-500">
                        {row.originalIdx}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-100 group-hover:text-indigo-300 transition-colors uppercase">{row.name.toUpperCase()}</div>
                        {row.nip && row.nip !== "-" && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            NIP: {row.nip}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-300">
                        <span className="font-medium text-neutral-200">{row.mapel}</span>
                        {row.kelas && row.kelas !== "-" && (
                          <span className="text-[11px] text-neutral-500 block">{row.kelas}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {row.total !== null ? (
                          <span className="text-white">
                            {row.total} <span className="text-[10px] text-neutral-500 font-normal">/{SKOR_MAKS}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-normal">–</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {row.percentage !== null ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                              <span>{Math.round(row.percentage)}%</span>
                            </div>
                            <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${row.percentage}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-600 font-mono">–</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${row.predikat.bgClass} ${row.predikat.borderClass}`}
                        >
                          {row.predikat.label} {row.predikat.grade !== "-" ? `(${row.predikat.grade})` : ""}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-[11px] text-neutral-500 font-mono">
                        {row.updatedAt
                          ? new Date(row.updatedAt).toLocaleDateString("id-ID")
                          : "-"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectTeacherForEdit(row.name)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-xl transition-colors border border-transparent hover:border-indigo-500/20"
                            title="Nilai / Ubah Supervisi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectTeacherForPrint(row.name)}
                            className="p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-xl transition-colors border border-transparent hover:border-neutral-700"
                            title="Cetak Lembar Supervisi Guru"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {row.hasRecord && (
                            <button
                              onClick={() => {
                                if (confirmDelete === row.name) {
                                  onDeleteRecord(row.name);
                                  setConfirmDelete(null);
                                } else {
                                  setConfirmDelete(row.name);
                                }
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                confirmDelete === row.name
                                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                  : "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                              }`}
                              title={confirmDelete === row.name ? "Klik sekali lagi untuk menghapus nilai" : "Hapus Nilai Supervisi"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
