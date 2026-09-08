import { SectionCategory, PredikatInfo, ScoreValue, SupervisionRecord } from "../types";

export const DEFAULT_TEACHERS: string[] = [
  "ABDUL MUKTI LAMOHAMAD",
  "ABDUL RAHMAN BAHSOAN",
  "ABDULAZIS KARIM LABANGA",
  "ABDURRAHMAN ABDULLAH",
  "AIS DJAFAR",
  "ALVIAN LANTI",
  "AMNAH M. HASAN",
  "ANA LASIMPALA",
  "ANDRI RIZKI ROTINSULU",
  "ASTI JULIA MANSI",
  "AYUNITA TULIABU",
  "DIANA ELITA",
  "ENDANG H. USULI",
  "ERNA ANDRIYANA VAN GOBEL",
  "FARIDA RAHIM",
  "FATHRAH MIOLO",
  "FATMA JUITA DATAU",
  "FAZRION LITTI",
  "FITRI ABDUL KADIR LUAWO",
  "HAINA POMALINGO",
  "HARTINI VAN SOLANG",
  "HARYANI BIGA",
  "IDRUS AHMAD",
  "IRFAN SYAHRUL BASRI",
  "IRVAN I. KOBA",
  "LA ODE RELY",
  "LAZIJMATUL HILMA KAU",
  "MARDIYAH HAYATI DAENG MULISA",
  "MEMY RESTIANI ISHAK",
  "MIRNAWATI ISMAIL",
  "MUSDALIFAH",
  "NAFTALYN ISA",
  "NIKMA YAHYA",
  "NORMAWATY FAZRA A. LAYA",
  "NURAIDA KADIR",
  "NURHUDA PASISINGI",
  "NURLAILA DODA",
  "NURLELA MAMONTO",
  "NURYANTI SOLEMAN",
  "PATRIA WUMU",
  "PUTRI VERONICA A. ABDUL",
  "RAHAYU ABDUL",
  "RAHMAH SAID",
  "RAMDHAN UMAR",
  "RIAMTI BORA",
  "RINI YUSUF AHMAD",
  "RITA IBRAHIM LIPUTO",
  "RIZAL ABDUL",
  "RODIFA CHOIRULLY",
  "ROSTIN IGIRISA",
  "SARIFIN AHMAD",
  "SATRIA RUCHBAN",
  "SITTI SAHRA SANUSI",
  "SRI DEWI HAMBA",
  "SRI INDRAWATY NINGSIH KADIR",
  "SRI MAHDALANA MACHMUD",
  "SRI NINGSIH H. SUMOMBO",
  "SRI RAHAYU HUSAIN",
  "SUMARNI TARJO",
  "SURIANTI DUNGGIO",
  "SURIYONO SUMA",
  "SURYANINGSI",
  "SURYAWAN AL BASYA",
  "SYAHRUL RAMDHAN",
  "TOMY PRIYONO LAWANI",
  "ULIN KASAN",
  "WAHAB ALI",
  "WIRNAWATY R. ISRA",
  "YOLA SALEHE",
  "YUNNIASTATI BADERAN",
  "ZIKHARNI YUSUF",
  "ZURIYATI SOLEMAN"
];

export const SECTIONS: SectionCategory[] = [
  {
    id: "A",
    title: "Perencanaan Program Semester",
    items: [
      {
        no: 1,
        nama: "Kalender Pendidikan",
        bukti: [
          "Dokumen Kalender Pendidikan Nasional.",
          "Kalender Pendidikan Satuan Pendidikan.",
          "Penyesuaian/penandaan hari efektif belajar.",
          "Bukti sosialisasi/catatan koordinasi kalender.",
          "Agenda khusus sekolah yang masuk dalam jadwal."
        ]
      },
      {
        no: 2,
        nama: "Analisis Minggu Efektif",
        bukti: [
          "Perhitungan jumlah minggu efektif per semester.",
          "Identifikasi hari libur dan cadangan waktu.",
          "Distribusi jam pelajaran sesuai beban kurikulum.",
          "Kesesuaian rincian dengan kalender pendidikan.",
          "Dokumentasi analisis untuk perencanaan semester."
        ]
      },
      {
        no: 3,
        nama: "Program Tahunan",
        bukti: [
          "Identitas mata pelajaran dan tahun pelajaran.",
          "Pemetaan Capaian Pembelajaran (CP) ke TP.",
          "Distribusi alokasi waktu untuk satu tahun.",
          "Penjadwalan materi/projek secara kronologis.",
          "Tanda tangan pengesahan oleh Kepala Sekolah."
        ]
      },
      {
        no: 4,
        nama: "Program Semester",
        bukti: [
          "Identitas program semester ganjil/genap.",
          "Rincian alokasi waktu per bulan/minggu.",
          "Pemetaan materi/TP per bulan.",
          "Target ketercapaian materi per semester.",
          "Jadwal rencana asesmen sumatif semester."
        ]
      }
    ]
  },
  {
    id: "B",
    title: "Perencanaan Pembelajaran",
    items: [
      {
        no: 5,
        nama: "Analisis Capaian Pembelajaran (CP)",
        bukti: [
          "Dokumen CP terbaru sesuai fase.",
          "Hasil bedah elemen dan sub-elemen CP.",
          "Penentuan kompetensi kunci yang harus dicapai.",
          "Identifikasi prasyarat belajar murid.",
          "Bukti kaitan CP dengan visi misi sekolah."
        ]
      },
      {
        no: 6,
        nama: "Alur Tujuan Pembelajaran (ATP)",
        bukti: [
          "Rumusan TP yang diturunkan dari CP.",
          "Urutan TP disusun logis (konkret ke abstrak / mudah ke sulit / hierarki / prosedural / scaffolding).",
          "Keterkaitan antar TP dalam satu fase.",
          "Kesesuaian dengan struktur kurikulum satuan.",
          "Catatan penyesuaian ATP sesuai kebutuhan murid."
        ]
      },
      {
        no: 7,
        nama: "Modul Ajar / RPP",
        bukti: [
          "Identitas lengkap dan tujuan pembelajaran jelas.",
          "Langkah kegiatan pembelajaran (Pendahuluan, Inti, Penutup).",
          "Diferensiasi proses, konten, atau produk.",
          "Rencana asesmen terpadu (Formatif & Sumatif).",
          "Disahkan oleh Kepala Sekolah."
        ]
      },
      {
        no: 8,
        nama: "Asesmen Awal (Diagnostik)",
        bukti: [
          "Instrumen asesmen awal kognitif / non-kognitif.",
          "Hasil analisis profil belajar dan kesiapan murid.",
          "Pemetaan kebutuhan belajar murid di kelas.",
          "Rencana tindak lanjut berdasarkan hasil asesmen.",
          "Bukti penggunaan data awal untuk diferensiasi mengajar."
        ]
      },
      {
        no: 9,
        nama: "Jadwal Tatap Muka",
        bukti: [
          "Jadwal mengajar resmi satuan pendidikan.",
          "SK pembagian tugas mengajar dari pimpinan.",
          "Kesesuaian jam mengajar dengan ketentuan sertifikasi/beban kerja.",
          "Kesesuaian dengan struktur kurikulum."
        ]
      }
    ]
  },
  {
    id: "C",
    title: "Pelaksanaan Pembelajaran",
    items: [
      {
        no: 10,
        nama: "Jurnal Pembelajaran Harian",
        bukti: [
          "Catatan harian pelaksanaan pembelajaran.",
          "Rekap materi yang sudah tuntas diajarkan.",
          "Catatan kehadiran dan keaktifan partisipasi murid harian.",
          "Refleksi guru tentang kendala pembelajaran.",
          "Paraf / verifikasi berkala dari Kepala Sekolah/Kurikulum."
        ]
      },
      {
        no: 11,
        nama: "Buku Paket / Modul / LKPD",
        bukti: [
          "Daftar buku paket utama (Buku Teks Pemerintah/Kurator).",
          "Modul ajar mandiri buatan guru.",
          "LKPD yang memfasilitasi berpikir kritis (HOTS).",
          "Kesesuaian sumber belajar dengan kurikulum.",
          "Bukti distribusi sumber belajar ke murid."
        ]
      },
      {
        no: 12,
        nama: "Bahan Ajar Berbasis ICT / Media Digital",
        bukti: [
          "Presentasi digital interaktif (Canva, PowerPoint, Slides).",
          "Video pembelajaran edukatif (kreasi mandiri / kurasi relevan).",
          "Tautan platform LMS (Google Classroom, PMM, dll).",
          "Penggunaan aplikasi kuis interaktif (Quizizz, Kahoot, Wordwall).",
          "Bukti interaksi digital yang memotivasi murid."
        ]
      },
      {
        no: 13,
        nama: "Materi Ajar / Handout",
        bukti: [
          "Ringkasan materi (Handout) tercetak / digital.",
          "Kesesuaian materi dengan indikator TP.",
          "Sistematika penyajian materi yang runtut dan menarik.",
          "Referensi tambahan di luar buku paket utama.",
          "Bukti distribusi dan pemanfaatan oleh siswa."
        ]
      },
      {
        no: 14,
        nama: "Kisi-kisi Soal",
        bukti: [
          "Kisi-kisi soal sesuai indikator TP.",
          "Distribusi level kognitif (L1 Pengetahuan, L2 Aplikasi, L3 Penalaran/HOTS).",
          "Kesesuaian bentuk soal (Tes Pilihan Ganda, Uraian, Kinerja/Portofolio).",
          "Kaitan soal dengan konteks dunia nyata / kontekstual.",
          "Bukti validasi atau telaah kisi-kisi oleh teman sejawat/MGMP."
        ]
      }
    ]
  },
  {
    id: "D",
    title: "Penilaian dan Evaluasi",
    items: [
      {
        no: 15,
        nama: "Analisis Penilaian Harian / Formatif",
        bukti: [
          "Rekap hasil nilai formatif / sumatif lingkup materi.",
          "Analisis ketuntasan belajar per individu dan klasikal.",
          "Identifikasi materi atau soal yang sulit dipahami murid.",
          "Daftar murid yang memerlukan bimbingan khusus.",
          "Bukti umpan balik (feedback deskriptif) hasil kerja murid."
        ]
      },
      {
        no: 16,
        nama: "Daftar Nilai Lengkap",
        bukti: [
          "Rekapitulasi nilai Formatif proses harian.",
          "Rekapitulasi nilai Sumatif akhir lingkup materi.",
          "Dokumentasi nilai Kokurikuler / P5 / Projek.",
          "Pengolahan nilai akhir berbasis kompetensi dan deskripsi capaian.",
          "Arsip bukti nilai yang tersusun rapi dan akuntabel."
        ]
      },
      {
        no: 17,
        nama: "Program Remedial & Pengayaan",
        bukti: [
          "Daftar murid peserta program remedial dan pengayaan.",
          "Dokumen rencana dan materi remedial khusus.",
          "Dokumen rencana dan aktivitas pengayaan untuk murid tuntas.",
          "Analisis hasil setelah perbaikan / tes ulang.",
          "Bukti pendampingan individu bagi murid berkebutuhan khusus."
        ]
      },
      {
        no: 18,
        nama: "Daftar Hadir Siswa",
        bukti: [
          "Buku/File absensi murid yang terisi secara rutin dan rapi.",
          "Rekap bulanan persentase kehadiran kelas.",
          "Catatan alasan ketidakhadiran (Sakit, Izin, Alpa).",
          "Bukti tindak lanjut bagi murid yang sering absen.",
          "Dokumentasi komunikasi / home visit dengan orang tua murid."
        ]
      },
      {
        no: 19,
        nama: "KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)",
        bukti: [
          "Dokumen KKTP untuk setiap Tujuan Pembelajaran (TP).",
          "Rubrik deskripsi kriteria pencapaian (deskriptor kualitas).",
          "Penetapan interval nilai atau skala jenjang yang jelas.",
          "Bukti penggunaan KKTP dalam mengolah rapor siswa.",
          "Kesesuaian kriteria dengan karakteristik mata pelajaran dan murid."
        ]
      }
    ]
  }
];

export const SKOR_MAX_PER_ITEM = 4;
export const TOTAL_INDIKATOR = SECTIONS.reduce((s, sec) => s + sec.items.length, 0); // 19
export const SKOR_MAKS = TOTAL_INDIKATOR * SKOR_MAX_PER_ITEM; // 76

export const SCORE_RUBRIC_DESCRIPTIONS: Record<number, { title: string; desc: string }> = {
  0: { title: "Tidak Ada", desc: "Dokumen bukti fisik tidak ada sama sekali atau tidak dibuat." },
  1: { title: "Kurang Lengkap", desc: "Ada dokumen, namun bukti otentik sangat minim (hanya 1 kriteria terpenuhi)." },
  2: { title: "Cukup Lengkap", desc: "Dokumen ada dan memenuhi 2-3 kriteria bukti otentik, perlu penyempurnaan." },
  3: { title: "Baik / Lengkap", desc: "Dokumen lengkap memenuhi 4 kriteria bukti otentik secara konsisten." },
  4: { title: "Sangat Baik", desc: "Dokumen sangat lengkap, memenuhi seluruh bukti otentik, rapi, dan berkualitas tinggi." }
};

export function slugifyTeacher(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPredikat(pct: number | null): PredikatInfo {
  if (pct === null) {
    return {
      label: "Belum Disupervisi",
      grade: "-",
      cls: "z",
      desc: "Belum ada indikator yang dinilai",
      bgClass: "bg-neutral-800/80 text-neutral-400",
      textClass: "text-neutral-400",
      borderClass: "border-neutral-700/60"
    };
  }

  const rounded = Math.round(pct * 10) / 10;

  if (rounded >= 86) {
    return {
      label: "Amat Baik",
      grade: "A",
      cls: "ab",
      desc: "Administrasi sangat lengkap, relevan, dan bermutu tinggi",
      bgClass: "bg-emerald-500/10 text-emerald-400",
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/25"
    };
  }
  if (rounded >= 71) {
    return {
      label: "Baik",
      grade: "B",
      cls: "b",
      desc: "Administrasi lengkap dan memenuhi standar yang dipersyaratkan",
      bgClass: "bg-indigo-500/10 text-indigo-400",
      textClass: "text-indigo-400",
      borderClass: "border-indigo-500/25"
    };
  }
  if (rounded >= 56) {
    return {
      label: "Cukup",
      grade: "C",
      cls: "c",
      desc: "Administrasi cukup lengkap, namun perlu perbaikan pada beberapa aspek",
      bgClass: "bg-amber-500/10 text-amber-400",
      textClass: "text-amber-400",
      borderClass: "border-amber-500/25"
    };
  }
  return {
    label: "Kurang",
    grade: "D",
    cls: "k",
    desc: "Administrasi masih kurang lengkap dan memerlukan pembinaan intensif",
    bgClass: "bg-rose-500/10 text-rose-400",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/25"
  };
}

export function createBlankRecord(name: string, defaultSupervisor = "", defaultNipSupervisor = ""): SupervisionRecord {
  const scores: Record<number, ScoreValue> = {};
  SECTIONS.forEach(sec => {
    sec.items.forEach(it => {
      scores[it.no] = null;
    });
  });

  const today = new Date().toISOString().split("T")[0];

  return {
    name,
    nip: "",
    mapel: "",
    kelas: "",
    jtm: "",
    tugasTambahan: "",
    sertifikasi: "",
    driveUrl: "",
    scores,
    catatan: "",
    tindakLanjut: "",
    namaSupervisor: defaultSupervisor,
    nipSupervisor: defaultNipSupervisor,
    tanggal: today,
    updatedAt: null
  };
}

export function calculateScoreSummary(record: SupervisionRecord): {
  total: number;
  count: number;
  percentage: number | null;
  predikat: PredikatInfo;
  sectionBreakdown: { id: string; title: string; total: number; max: number; pct: number }[];
} {
  let total = 0;
  let count = 0;

  const sectionBreakdown = SECTIONS.map(sec => {
    let secTotal = 0;
    const secMax = sec.items.length * SKOR_MAX_PER_ITEM;
    sec.items.forEach(it => {
      const val = record.scores[it.no];
      if (val !== null && val !== undefined) {
        secTotal += val;
        total += val;
        count++;
      }
    });
    return {
      id: sec.id,
      title: sec.title,
      total: secTotal,
      max: secMax,
      pct: secMax > 0 ? (secTotal / secMax) * 100 : 0
    };
  });

  const percentage = count > 0 ? (total / SKOR_MAKS) * 100 : null;
  const predikat = getPredikat(percentage);

  return {
    total,
    count,
    percentage,
    predikat,
    sectionBreakdown
  };
}

export const AUTO_FEEDBACK_TEMPLATES = [
  {
    type: "excellent",
    minPct: 86,
    catatan: "Kelengkapan administrasi pembelajaran sangat baik dan memenuhi standar Kurikulum Merdeka secara komprehensif. Dokumen tersusun rapi, asesmen diagnostik dan formatif terdokumentasi dengan sangat baik.",
    tindakLanjut: "Pertahankan kualitas administrasi dan dapat dijadikan contoh praktik baik (best practice) bagi rekan guru lainnya melalui komunitas belajar/MGMP sekolah."
  },
  {
    type: "good",
    minPct: 71,
    catatan: "Secara umum administrasi perencanaan dan pelaksanaan pembelajaran sudah lengkap dan terstruktur dengan baik. Terdapat beberapa hal kecil yang perlu disempurnakan seperti keteraturan jurnal dan kisi-kisi asesmen.",
    tindakLanjut: "Melengkapi rubrik KKTP dan melampirkan tindak lanjut program remedial dan pengayaan pada pertemuan berkala."
  },
  {
    type: "fair",
    minPct: 56,
    catatan: "Administrasi sudah dibuat sebagian, namun masih banyak komponen penting yang belum terdokumentasi lengkap (terutama pada Asesmen Awal, Modul Ajar berdiferensiasi, dan analisis hasil penilaian).",
    tindakLanjut: "Perlu pendampingan khusus oleh Tim Pengembang Kurikulum/Wakasek Kurikulum untuk melengkapi Modul Ajar dan analisis asesmen dalam kurun waktu 2 minggu."
  },
  {
    type: "poor",
    minPct: 0,
    catatan: "Kelengkapan administrasi guru masih sangat minim. Banyak instrumen pokok perencanaan maupun evaluasi yang belum disiapkan.",
    tindakLanjut: "Diberikan pembinaan terarah secara berkala dan diwajibkan menyusun ulang perangkat pembelajaran bersama guru serumpun/Kombel sebelum batas waktu yang ditentukan."
  }
];
