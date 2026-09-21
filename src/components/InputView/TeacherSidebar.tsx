import React, { useState, useMemo } from "react";
import { SupervisionIndex } from "../../types";
import { slugifyTeacher } from "../../data/supervisionData";
import { isDummyTeacher } from "../../utils/storage";
import { Search, UserCheck, UserX, UserPlus, Users, X, FolderCheck } from "lucide-react";

interface TeacherSidebarProps {
  teachers: string[];
  activeTeacher: string;
  onSelectTeacher: (name: string) => void;
  index: SupervisionIndex;
  onAddTeacher: (name: string) => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  teachers,
  activeTeacher,
  onSelectTeacher,
  index,
  onAddTeacher
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "done" | "pending">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");

  const validTeachers = useMemo(() => {
    return teachers.filter(t => !isDummyTeacher(t));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return validTeachers.filter((teacher) => {
      const matchesSearch = teacher.toLowerCase().includes(searchTerm.toLowerCase());
      const slug = slugifyTeacher(teacher);
      const isDone = !!index[slug];

      if (!matchesSearch) return false;
      if (filterMode === "done") return isDone;
      if (filterMode === "pending") return !isDone;
      return true;
    });
  }, [validTeachers, searchTerm, filterMode, index]);

  const doneCount = useMemo(() => {
    return validTeachers.filter(t => !!index[slugifyTeacher(t)]).length;
  }, [validTeachers, index]);

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    onAddTeacher(newTeacherName.trim().toUpperCase());
    setNewTeacherName("");
    setIsAdding(false);
  };

  return (
    <aside className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[760px] sticky top-4">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-800/90 bg-neutral-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Daftar Guru
            </span>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded-md font-semibold">
              {validTeachers.length}
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
            title="Tambah guru baru"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Add Teacher Form */}
        {isAdding && (
          <form onSubmit={handleCreateTeacher} className="p-3 bg-neutral-950 rounded-2xl border border-indigo-500/30 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Tambah Guru Baru</span>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value.toUpperCase())}
              placeholder="CONTOH: DRA. HJ. SITI RAHMA, M.PD"
              autoFocus
              className="w-full text-xs px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 uppercase"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[11px] px-2.5 py-1 text-neutral-400 hover:bg-neutral-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="text-[11px] px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8.5 pr-8 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 text-[10.5px]">
          <button
            onClick={() => setFilterMode("all")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-center font-medium transition-all ${
              filterMode === "all"
                ? "bg-neutral-100 text-neutral-950 font-bold"
                : "bg-neutral-950/80 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
            }`}
          >
            Semua ({teachers.length})
          </button>
          <button
            onClick={() => setFilterMode("done")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-center font-medium transition-all inline-flex items-center justify-center gap-1 ${
              filterMode === "done"
                ? "bg-neutral-100 text-neutral-950 font-bold"
                : "bg-neutral-950/80 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
            }`}
          >
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Sudah ({doneCount})</span>
          </button>
          <button
            onClick={() => setFilterMode("pending")}
            className={`flex-1 py-1.5 px-1.5 rounded-lg text-center font-medium transition-all inline-flex items-center justify-center gap-1 ${
              filterMode === "pending"
                ? "bg-neutral-100 text-neutral-950 font-bold"
                : "bg-neutral-950/80 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
            }`}
          >
            <UserX className="w-3 h-3 text-neutral-500" />
            <span>Belum ({teachers.length - doneCount})</span>
          </button>
        </div>
      </div>

      {/* Teachers List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/50 p-1.5 space-y-0.5">
        {filteredTeachers.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            <p>Tidak ada guru yang sesuai kriteria.</p>
          </div>
        ) : (
          filteredTeachers.map((teacher) => {
            const slug = slugifyTeacher(teacher);
            const entry = index[slug];
            const isDone = !!entry;
            const isActive = teacher === activeTeacher;

            return (
              <button
                key={teacher}
                onClick={() => onSelectTeacher(teacher)}
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-start justify-between gap-2.5 transition-all text-xs group ${
                  isActive
                    ? "bg-neutral-800 border border-neutral-700/80 text-white shadow-md"
                    : "hover:bg-neutral-800/50 text-neutral-300 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors ${
                      isActive
                        ? isDone
                          ? "bg-emerald-400 ring-2 ring-emerald-400/40"
                          : "bg-indigo-400 ring-2 ring-indigo-400/40"
                        : isDone
                        ? "bg-emerald-500"
                        : "bg-neutral-700"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate leading-snug uppercase ${isActive ? "font-bold text-white" : "font-medium text-neutral-200"}`}>
                      {teacher.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {entry && entry.mapel && (
                        <div className="truncate text-[10px] text-neutral-400">
                          {entry.mapel}
                        </div>
                      )}
                      {entry?.driveUrl && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 flex-shrink-0"
                          title="Tersedia link soft copy Google Drive"
                        >
                          <FolderCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Drive</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {entry && entry.percentage !== null && (
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold border ${
                        entry.predikatCls === "ab"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : entry.predikatCls === "b"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : entry.predikatCls === "c"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {Math.round(entry.percentage)}%
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 mt-0.5">
                      {entry.total}/76
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar Bento Footer */}
      <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/60 text-[11px] text-neutral-400 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Progress</span>
        <span className="font-mono font-bold text-neutral-200">
          {doneCount} / {validTeachers.length} ({Math.round((doneCount / (validTeachers.length || 1)) * 100)}%)
        </span>
      </div>
    </aside>
  );
};
