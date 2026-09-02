import React, { useMemo } from "react";
import { SchoolMeta, SupervisionIndex } from "../../types";
import { SECTIONS, SKOR_MAX_PER_ITEM, slugifyTeacher } from "../../data/supervisionData";
import { getTeacherRecord } from "../../utils/storage";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Layers, 
  Target,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface AnalyticsDashboardProps {
  teachers: string[];
  index: SupervisionIndex;
  schoolMeta: SchoolMeta;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  teachers,
  index,
  schoolMeta
}) => {
  // Compute aggregated scores for all 19 indicators across all supervised teachers
  const { indicatorStats, sectionStats, supervisedCount } = useMemo(() => {
    const supervisedTeachers = teachers.filter((t) => !!index[slugifyTeacher(t)]);
    const count = supervisedTeachers.length;

    // Load records for all supervised teachers
    const records = supervisedTeachers.map((t) => getTeacherRecord(t, schoolMeta));

    // Stats for each item 1..19
    const itemMap: Record<number, { total: number; ratedCount: number }> = {};
    for (let i = 1; i <= 19; i++) {
      itemMap[i] = { total: 0, ratedCount: 0 };
    }

    records.forEach((rec) => {
      for (let i = 1; i <= 19; i++) {
        const val = rec.scores[i];
        if (val !== null && val !== undefined) {
          itemMap[i].total += val;
          itemMap[i].ratedCount++;
        }
      }
    });

    const indStats = SECTIONS.flatMap((sec) =>
      sec.items.map((it) => {
        const data = itemMap[it.no];
        const avg = data.ratedCount > 0 ? data.total / data.ratedCount : 0;
        const pct = (avg / SKOR_MAX_PER_ITEM) * 100;
        return {
          sectionId: sec.id,
          sectionTitle: sec.title,
          no: it.no,
          nama: it.nama,
          avg: Math.round(avg * 100) / 100,
          pct: Math.round(pct * 10) / 10,
          ratedCount: data.ratedCount
        };
      })
    );

    // Section stats
    const secStats = SECTIONS.map((sec) => {
      const secItems = indStats.filter((it) => it.sectionId === sec.id);
      const avgPct = secItems.length > 0
        ? secItems.reduce((acc, cur) => acc + cur.pct, 0) / secItems.length
        : 0;
      return {
        id: sec.id,
        title: sec.title,
        itemCount: sec.items.length,
        avgPct: Math.round(avgPct * 10) / 10
      };
    });

    return {
      indicatorStats: indStats,
      sectionStats: secStats,
      supervisedCount: count
    };
  }, [teachers, index, schoolMeta]);

  // Sort indicators by performance
  const sortedIndicators = useMemo(() => {
    return [...indicatorStats].sort((a, b) => b.pct - a.pct);
  }, [indicatorStats]);

  const topIndicators = sortedIndicators.slice(0, 3);
  const bottomIndicators = [...sortedIndicators].reverse().slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner Bento Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Diagnostik Mutu Administrasi
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                Berdasarkan {supervisedCount} guru yang telah disupervisi
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight mt-1.5">
              Analisis Capaian 19 Indikator Administrasi
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Pemetaan kekuatan dan aspek yang memerlukan bimbingan teknis / workshop di lingkungan {schoolMeta.sekolah}
            </p>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800 p-3.5 rounded-2xl text-right sm:self-auto self-stretch">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Total Indikator</span>
            <div className="font-mono text-2xl font-bold text-indigo-400">19 Butir</div>
          </div>
        </div>
      </div>

      {/* 4 Section Bento Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectionStats.map((sec) => (
          <div
            key={sec.id}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/30">
                  {sec.id}
                </span>
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {supervisedCount > 0 ? `${sec.avgPct}%` : "–"}
                </span>
              </div>
              <h3 className="font-bold text-sm text-neutral-100 leading-snug">
                {sec.title}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                {sec.itemCount} butir instrumen
              </p>
            </div>

            <div className="w-full bg-neutral-950 rounded-full h-2 mt-4 overflow-hidden border border-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sec.avgPct >= 80 ? "bg-emerald-500" : sec.avgPct >= 65 ? "bg-indigo-500" : "bg-amber-500"
                }`}
                style={{ width: `${sec.avgPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Focus Areas Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top 3 Strengths */}
        <div className="bg-neutral-900 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-emerald-400">
                3 Aspek Paling Dikuasai (Kekuatan)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Indikator dengan rata-rata persentase kelengkapan tertinggi
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topIndicators.map((it, idx) => (
              <div key={it.no} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3 hover:border-emerald-500/30 transition-all">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-neutral-100 truncate">
                      {it.no}. {it.nama}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">
                      Bagian {it.sectionId}: {it.sectionTitle}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {supervisedCount > 0 ? `${it.pct}%` : "–"}
                  </span>
                  <div className="text-[10px] text-neutral-500 font-mono">Skor: {it.avg}/4.0</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Needs Improvement */}
        <div className="bg-neutral-900 border border-rose-500/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-rose-400">
                3 Aspek Perlu Pendampingan (Prioritas Pembinaan)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Indikator dengan nilai terendah yang memerlukan workshop/Kombel
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {bottomIndicators.map((it, idx) => (
              <div key={it.no} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 flex items-center justify-between gap-3 hover:border-rose-500/30 transition-all">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono font-bold text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-neutral-100 truncate">
                      {it.no}. {it.nama}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">
                      Bagian {it.sectionId}: {it.sectionTitle}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {supervisedCount > 0 ? `${it.pct}%` : "–"}
                  </span>
                  <div className="text-[10px] text-neutral-500 font-mono">Skor: {it.avg}/4.0</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Action Plan (Rekomendasi Tindak Lanjut Sekolah) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base text-neutral-100">
            Rekomendasi Tindak Lanjut Program Keprofesian Berkelanjutan (PKB)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>1. Penguatan Melalui Komunitas Belajar</span>
            </div>
            <p className="text-neutral-400 text-[11.5px] leading-relaxed">
              Mengagendakan sesi telaah bersama perangkat Asesmen Awal & KKTP antarguru mata pelajaran serumpun setiap dua minggu sekali.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="font-bold text-indigo-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>2. Workshop Pembuatan Media Interaktif</span>
            </div>
            <p className="text-neutral-400 text-[11.5px] leading-relaxed">
              Memfasilitasi pelatihan pemanfaatan platform pembelajaran digital (Quizizz, Google Classroom, Canva Edu) untuk meningkatkan skor bahan ajar ICT.
            </p>
          </div>

          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>3. Pemodelan Praktik Baik (Peer Coaching)</span>
            </div>
            <p className="text-neutral-400 text-[11.5px] leading-relaxed">
              Menunjuk guru dengan predikat Amat Baik sebagai mentor pendamping bagi guru yang membutuhkan penguatan pada penyusunan instrumen remedial/pengayaan.
            </p>
          </div>
        </div>
      </div>

      {/* Complete 19 Indicator Table in Bento Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="font-bold text-sm sm:text-base text-neutral-100">
            Tabel Lengkap Capaian 19 Butir Indikator
          </h3>
          <span className="text-xs text-neutral-500 font-mono">Diurutkan berdasarkan butir instrumen 1 - 19</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold text-[10px] tracking-wider font-mono">
                <th className="py-3 px-4 text-center w-14">No</th>
                <th className="py-3 px-4">Komponen & Indikator</th>
                <th className="py-3 px-4">Kategori Bagian</th>
                <th className="py-3 px-4 text-center w-28">Rata-rata Skor</th>
                <th className="py-3 px-4 w-44">Tingkat Ketercapaian</th>
                <th className="py-3 px-4 text-center w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {indicatorStats.map((it) => (
                <tr key={it.no} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-neutral-500 font-bold">
                    {it.no}
                  </td>
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    {it.nama}
                  </td>
                  <td className="py-3 px-4 text-neutral-400 text-[11px]">
                    {it.sectionTitle}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-neutral-100">
                    {supervisedCount > 0 ? `${it.avg} / 4.0` : "–"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>{supervisedCount > 0 ? `${it.pct}%` : "–"}</span>
                      </div>
                      <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${it.pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
                        it.pct >= 85
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : it.pct >= 70
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : it.pct >= 55
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {it.pct >= 85 ? "Optimal" : it.pct >= 70 ? "Cukup Baik" : "Perlu Bimbingan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
