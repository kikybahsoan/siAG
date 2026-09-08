import React from "react";
import { SchoolMeta, SupervisionRecord } from "../../types";
import { 
  SECTIONS, 
  SKOR_MAKS, 
  calculateScoreSummary, 
  SCORE_RUBRIC_DESCRIPTIONS 
} from "../../data/supervisionData";
import { Printer, ArrowLeft, Building2 } from "lucide-react";

interface PrintSheetProps {
  record: SupervisionRecord;
  schoolMeta: SchoolMeta;
  teachers: string[];
  onSelectTeacher: (name: string) => void;
  onBack: () => void;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  record,
  schoolMeta,
  teachers,
  onSelectTeacher,
  onBack
}) => {
  const summary = calculateScoreSummary(record);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = record.tanggal
    ? new Date(record.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Input</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">Pilih Guru:</span>
            <select
              value={record.name}
              onChange={(e) => onSelectTeacher(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium uppercase"
            >
              {teachers.map((t) => (
                <option key={t} value={t} className="bg-neutral-900 text-neutral-100 uppercase">
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF (A4)</span>
        </button>
      </div>

      {/* Formal Printable Document Canvas */}
      <div className="bg-white border border-[#DCD5C2] print:border-none shadow-md print:shadow-none p-6 sm:p-10 max-w-[860px] mx-auto text-black font-serif leading-normal">
        {/* Kop Surat Sekolah dengan Logo Resmi */}
        <div className="flex items-center gap-4 sm:gap-6 pb-3 border-b-2 border-black">
          <img
            src={schoolMeta.logoUrl || "/logo new.jpg"}
            alt="Logo SMKN 2 Gorontalo"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain flex-shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("/logo-new.jpg")) {
                target.src = "/logo-new.jpg";
              }
            }}
          />
          <div className="text-center flex-1 space-y-1">
            <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-neutral-800">
              Pemerintah Daerah Provinsi / Dinas Pendidikan
            </h2>
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-black">
              {schoolMeta.sekolah || "SMKN 2 Gorontalo"}
            </h1>
            <p className="text-xs font-sans text-neutral-600">
              {schoolMeta.alamat ? `${schoolMeta.alamat} - ` : ""}
              {schoolMeta.kota || "Gorontalo"}
              {schoolMeta.npsn ? ` &middot; NPSN: ${schoolMeta.npsn}` : ""}
            </p>
          </div>
          <div className="w-20 sm:w-24 hidden sm:block flex-shrink-0" aria-hidden="true" />
        </div>
        <div className="border-b border-black mt-0.5 mb-5" />

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline underline-offset-4">
            Instrumen Supervisi Administrasi Guru
          </h3>
          <p className="text-xs font-sans text-neutral-700 mt-1 font-medium">
            Semester {schoolMeta.semester} &middot; Tahun Pelajaran {schoolMeta.tahun}
          </p>
        </div>

        {/* Identitas Guru & Mata Pelajaran */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs font-sans mb-6 bg-neutral-50 print:bg-transparent p-3 print:p-0 rounded border print:border-none border-neutral-200">
          <div className="flex">
            <span className="w-36 text-neutral-600">Nama Guru</span>
            <span className="font-semibold text-black uppercase">: {record.name.toUpperCase()}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Mata Pelajaran</span>
            <span className="font-semibold text-black">: {record.mapel || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">NIP / NUPTK</span>
            <span>: {record.nip || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Kelas / Fase</span>
            <span>: {record.kelas || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Tugas Tambahan</span>
            <span>: {record.tugasTambahan || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Jam Tatap Muka (JTM)</span>
            <span>: {record.jtm ? `${record.jtm} Jam/Minggu` : "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Sertifikasi Mapel</span>
            <span>: {record.sertifikasi || "-"}</span>
          </div>
          <div className="flex">
            <span className="w-36 text-neutral-600">Tanggal Supervisi</span>
            <span>: {formattedDate}</span>
          </div>
        </div>

        {/* Tabel 19 Indikator Supervisi */}
        <table className="w-full text-xs font-sans border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-neutral-100 print:bg-neutral-100 text-black font-bold">
              <th className="border border-black p-2 text-center w-8">No</th>
              <th className="border border-black p-2 text-left">Komponen / Aspek yang Disupervisi</th>
              <th className="border border-black p-2 text-center w-10">0</th>
              <th className="border border-black p-2 text-center w-10">1</th>
              <th className="border border-black p-2 text-center w-10">2</th>
              <th className="border border-black p-2 text-center w-10">3</th>
              <th className="border border-black p-2 text-center w-10">4</th>
              <th className="border border-black p-2 text-center w-14">Skor</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((sec) => (
              <React.Fragment key={sec.id}>
                {/* Section Sub-header */}
                <tr className="bg-neutral-200/80 font-bold">
                  <td className="border border-black p-1.5 text-center font-serif">{sec.id}</td>
                  <td colSpan={6} className="border border-black p-1.5 text-left">
                    {sec.title}
                  </td>
                  <td className="border border-black p-1.5 text-center font-mono">
                    {summary.sectionBreakdown.find((b) => b.id === sec.id)?.total || 0}
                  </td>
                </tr>

                {/* Section Items */}
                {sec.items.map((it) => {
                  const val = record.scores[it.no];
                  return (
                    <tr key={it.no} className="hover:bg-neutral-50">
                      <td className="border border-black p-1.5 text-center">{it.no}</td>
                      <td className="border border-black p-1.5">
                        <div className="font-medium text-black">{it.nama}</div>
                        <div className="text-[10px] text-neutral-500 italic mt-0.5 print:hidden">
                          {it.bukti[0]}
                        </div>
                      </td>
                      {[0, 1, 2, 3, 4].map((s) => (
                        <td key={s} className="border border-black p-1.5 text-center font-mono font-bold">
                          {val === s ? "✓" : ""}
                        </td>
                      ))}
                      <td className="border border-black p-1.5 text-center font-mono font-semibold">
                        {val !== null && val !== undefined ? val : "-"}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Total Row */}
            <tr className="bg-neutral-100 font-bold">
              <td colSpan={2} className="border border-black p-2 text-right uppercase">
                Jumlah Skor Perolehan (Maks. 76)
              </td>
              <td colSpan={5} className="border border-black p-2 text-center font-mono text-sm">
                {summary.total} / {SKOR_MAKS}
              </td>
              <td className="border border-black p-2 text-center font-mono text-sm">
                {summary.total}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Nilai Akhir & Kualifikasi Predikat Box */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-6">
          <div className="border border-black p-3 rounded-none space-y-1">
            <div className="text-neutral-600 uppercase text-[10.5px] font-bold">
              Rekapitulasi Ketercapaian
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span>Nilai Akhir Persentase:</span>
              <span className="font-bold text-base font-mono">
                {summary.percentage !== null ? `${summary.percentage.toFixed(1)}%` : "-"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span>Kualifikasi / Predikat:</span>
              <span className="font-bold text-sm uppercase">
                {summary.predikat.label} {summary.predikat.grade !== "-" ? `(${summary.predikat.grade})` : ""}
              </span>
            </div>
          </div>

          <div className="border border-black p-3 rounded-none text-[10.5px] space-y-0.5 text-neutral-700">
            <div className="font-bold text-black uppercase text-[10px]">
              Kriteria Rentang Nilai:
            </div>
            <div>&bull; 86% - 100% : Amat Baik (A)</div>
            <div>&bull; 71% - 85% : Baik (B)</div>
            <div>&bull; 56% - 70% : Cukup (C)</div>
            <div>&bull; &lt; 56% : Kurang (D)</div>
          </div>
        </div>

        {/* Catatan & Rekomendasi Tindak Lanjut */}
        <div className="border border-black p-3.5 mb-8 text-xs font-sans space-y-3">
          <div>
            <div className="font-bold text-black uppercase text-[11px] mb-1">
              Catatan Khusus Kepala Sekolah / Supervisor:
            </div>
            <p className="italic text-neutral-800 leading-relaxed min-h-[38px]">
              {record.catatan || "Administrasi pembelajaran telah diperiksa sesuai ketentuan Kurikulum Merdeka."}
            </p>
          </div>

          <div className="border-t border-neutral-300 pt-2">
            <div className="font-bold text-black uppercase text-[11px] mb-1">
              Rencana Tindak Lanjut (RTL):
            </div>
            <p className="italic text-neutral-800 leading-relaxed min-h-[38px]">
              {record.tindakLanjut || "Mempertahankan dan menyempurnakan implementasi perangkat pembelajaran secara berkelanjutan."}
            </p>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-10 text-xs font-sans text-center pt-2">
          <div>
            <p className="mb-1 text-neutral-700">Guru yang Disupervisi,</p>
            <div className="h-16 flex items-center justify-center">
              {/* Signature space */}
            </div>
            <p className="font-bold underline text-black uppercase">{record.name.toUpperCase()}</p>
            <p className="text-neutral-600 text-[11px]">NIP. {record.nip || "......................................."}</p>
          </div>

          <div>
            <p className="mb-1 text-neutral-700">
              {schoolMeta.kota || "Gorontalo"}, {formattedDate}
            </p>
            <p className="text-neutral-700">Kepala Sekolah / Supervisor,</p>
            <div className="h-16 flex items-center justify-center">
              {/* Signature space */}
            </div>
            <p className="font-bold underline text-black">
              {record.namaSupervisor || schoolMeta.kepalaSekolah || "......................................."}
            </p>
            <p className="text-neutral-600 text-[11px]">
              NIP. {record.nipSupervisor || schoolMeta.nipKepalaSekolah || "......................................."}
            </p>
          </div>
        </div>

        {/* Small Watermark */}
        <div className="mt-6 pt-2 border-t border-neutral-200 flex items-center justify-between text-[9px] text-neutral-400 font-mono">
          <span>Aplikasi Supervisi Administrasi Guru</span>
          <span>kikybahsoan - smkn2gorontalo</span>
        </div>
      </div>
    </div>
  );
};
