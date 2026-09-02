import { SchoolMeta, SupervisionIndex, SupervisionRecord } from "../types";
import { SECTIONS, SKOR_MAKS, getPredikat, slugifyTeacher } from "../data/supervisionData";
import { getTeacherRecord } from "./storage";

export function exportRekapToCSV(
  teachers: string[],
  index: SupervisionIndex,
  schoolMeta: SchoolMeta
): void {
  const headers = [
    "No",
    "Nama Guru",
    "NIP",
    "Mata Pelajaran",
    "Kelas",
    "JTM",
    "Tugas Tambahan",
    "Total Skor",
    "Skor Maks",
    "Persentase (%)",
    "Predikat",
    "Tanggal Supervisi",
    "Catatan",
    "Tindak Lanjut"
  ];

  const rows = teachers.map((teacher, idx) => {
    const slug = slugifyTeacher(teacher);
    const item = index[slug];
    const rec = getTeacherRecord(teacher, schoolMeta);

    const total = item?.total !== null && item?.total !== undefined ? item.total : "";
    const pct = item?.percentage !== null && item?.percentage !== undefined ? item.percentage.toFixed(1) : "";
    const pred = item ? item.predikatLabel : "Belum Disupervisi";

    return [
      idx + 1,
      `"${teacher.replace(/"/g, '""')}"`,
      `"${(rec.nip || "").replace(/"/g, '""')}"`,
      `"${(rec.mapel || "").replace(/"/g, '""')}"`,
      `"${(rec.kelas || "").replace(/"/g, '""')}"`,
      `"${(rec.jtm || "").replace(/"/g, '""')}"`,
      `"${(rec.tugasTambahan || "").replace(/"/g, '""')}"`,
      total,
      SKOR_MAKS,
      pct,
      `"${pred}"`,
      `"${(rec.tanggal || "").replace(/"/g, '""')}"`,
      `"${(rec.catatan || "").replace(/"/g, '""')}"`,
      `"${(rec.tindakLanjut || "").replace(/"/g, '""')}"`
    ];
  });

  const metadataRows = [
    ["REKAPITULASI HASIL SUPERVISI ADMINISTRASI GURU"],
    [`Satuan Pendidikan: ${schoolMeta.sekolah}`],
    [`Semester: ${schoolMeta.semester} - Tahun Pelajaran: ${schoolMeta.tahun}`],
    [`Kepala Sekolah: ${schoolMeta.kepalaSekolah} (NIP: ${schoolMeta.nipKepalaSekolah})`],
    [`Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`],
    []
  ];

  const csvContent = [
    ...metadataRows.map(r => r.join(",")),
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileName = `Rekap_Supervisi_Guru_${schoolMeta.sekolah.replace(/[^a-zA-Z0-9]/g, "_")}_${schoolMeta.tahun.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDetailedReportToCSV(
  teachers: string[],
  schoolMeta: SchoolMeta
): void {
  // Detailed 19 indicators per teacher
  const indHeaders = SECTIONS.flatMap(s => s.items.map(it => `"${it.no}. ${it.nama.replace(/"/g, '""')}"`));
  const headers = [
    "No",
    "Nama Guru",
    "Mata Pelajaran",
    ...indHeaders,
    "Total Skor",
    "Persentase (%)",
    "Predikat"
  ];

  const rows = teachers.map((teacher, idx) => {
    const rec = getTeacherRecord(teacher, schoolMeta);
    const indScores = SECTIONS.flatMap(s => s.items.map(it => rec.scores[it.no] ?? ""));
    
    let total = 0;
    let count = 0;
    SECTIONS.forEach(s => s.items.forEach(it => {
      const v = rec.scores[it.no];
      if (v !== null && v !== undefined) {
        total += v;
        count++;
      }
    }));

    const pct = count > 0 ? ((total / SKOR_MAKS) * 100).toFixed(1) : "";
    const pred = count > 0 ? getPredikat((total / SKOR_MAKS) * 100).label : "Belum Disupervisi";

    return [
      idx + 1,
      `"${teacher.replace(/"/g, '""')}"`,
      `"${(rec.mapel || "").replace(/"/g, '""')}"`,
      ...indScores,
      count > 0 ? total : "",
      pct,
      `"${pred}"`
    ];
  });

  const csvContent = [
    [`"MATRIKS DETAIL 19 INDIKATOR SUPERVISI - ${schoolMeta.sekolah.replace(/"/g, '""')}"`],
    [`"Semester: ${schoolMeta.semester} - Tahun Pelajaran: ${schoolMeta.tahun}"`],
    [],
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileName = `Detail_Matriks_Indikator_${schoolMeta.sekolah.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
