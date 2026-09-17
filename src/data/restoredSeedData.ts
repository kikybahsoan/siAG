import { SchoolMeta, ScoreValue, SupervisionIndex, SupervisionRecord } from "../types";
import { DEFAULT_TEACHERS, slugifyTeacher, calculateScoreSummary } from "./supervisionData";

export const RESTORED_SCHOOL_META: SchoolMeta = {
  sekolah: "SMKN 2 Gorontalo",
  npsn: "40501083",
  alamat: "Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah",
  semester: "Ganjil",
  tahun: "2026/2027",
  kota: "Gorontalo",
  kepalaSekolah: "Drs. H. Jakub A. GuE",
  nipKepalaSekolah: "196701051994031016",
  logoUrl: "/logo new.jpg",
  // Custom Kop Surat Settings
  kopType: "text",
  kopInstansi: "PEMERINTAH PROVINSI GORONTALO",
  kopDinas: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
  kopSekolah: "SMK NEGERI 2 GORONTALO",
  kopAlamat: "Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah",
  kopKontak: "Telp. (0435) 822557 | Website: smkn2gorontalo.sch.id | Email: smkn2gorontalo@yahoo.co.id",
  kopNpsnAkreditasi: "NPSN: 40501083 | Kode Pos: 96128 | Terakreditasi A",
  logoKananUrl: "",
  showLogoKanan: false
};

// Generate scores for 19 indicators to reach exact target total
function generateScoresForTotal(target: number): Record<number, ScoreValue> {
  const scores: Record<number, ScoreValue> = {};
  if (target === 76) {
    for (let i = 1; i <= 19; i++) scores[i] = 4;
  } else if (target === 75) {
    for (let i = 1; i <= 18; i++) scores[i] = 4;
    scores[19] = 3;
  } else if (target === 72) {
    for (let i = 1; i <= 15; i++) scores[i] = 4;
    for (let i = 16; i <= 19; i++) scores[i] = 3;
  } else if (target === 71) {
    for (let i = 1; i <= 14; i++) scores[i] = 4;
    for (let i = 15; i <= 19; i++) scores[i] = 3;
  } else if (target === 68) {
    for (let i = 1; i <= 11; i++) scores[i] = 4;
    for (let i = 12; i <= 19; i++) scores[i] = 3;
  } else if (target === 67) {
    for (let i = 1; i <= 10; i++) scores[i] = 4;
    for (let i = 11; i <= 19; i++) scores[i] = 3;
  } else if (target === 66) {
    for (let i = 1; i <= 9; i++) scores[i] = 4;
    for (let i = 10; i <= 19; i++) scores[i] = 3;
  } else if (target === 65) {
    for (let i = 1; i <= 8; i++) scores[i] = 4;
    for (let i = 9; i <= 19; i++) scores[i] = 3;
  } else if (target === 62) {
    for (let i = 1; i <= 5; i++) scores[i] = 4;
    for (let i = 6; i <= 19; i++) scores[i] = 3;
  } else if (target === 61) {
    for (let i = 1; i <= 4; i++) scores[i] = 4;
    for (let i = 5; i <= 19; i++) scores[i] = 3;
  } else if (target === 60) {
    for (let i = 1; i <= 3; i++) scores[i] = 4;
    for (let i = 4; i <= 19; i++) scores[i] = 3;
  } else if (target === 55) {
    for (let i = 1; i <= 17; i++) scores[i] = 3;
    scores[18] = 2;
    scores[19] = 2;
  } else if (target === 51) {
    for (let i = 1; i <= 13; i++) scores[i] = 3;
    for (let i = 14; i <= 19; i++) scores[i] = 2;
  } else if (target === 17) {
    for (let i = 1; i <= 17; i++) scores[i] = 1;
    scores[18] = 0;
    scores[19] = 0;
  } else {
    // Generic fallback distribution
    let remaining = target;
    for (let i = 1; i <= 19; i++) {
      const remainingIndicators = 20 - i;
      const val = Math.min(4, Math.max(0, Math.round(remaining / remainingIndicators))) as ScoreValue;
      scores[i] = val;
      remaining -= (val || 0);
    }
  }
  return scores;
}

export interface RestoredEntryRaw {
  name: string;
  nip?: string;
  mapel?: string;
  kelas?: string;
  jtm?: string;
  tugasTambahan?: string;
  totalSkor?: number;
  supervisor?: string;
  tanggal?: string;
  catatan?: string;
  tindakLanjut?: string;
}

export const RESTORED_ENTRIES_RAW: RestoredEntryRaw[] = [
  {
    name: "ABDUL MUKTI LAMOHAMAD",
    nip: "19800901 201001 1 002",
    mapel: "Konsentrasi Keahlian (Housekeeping)",
    kelas: "XI Hotel 1, XI Hotel 2 / Fase F",
    jtm: "14",
    tugasTambahan: "Ketua Program Keahlian",
    totalSkor: 68,
    supervisor: "Drs. H. Jakub A. GuE",
    tanggal: "2026-09-08",
    catatan: "Kelengkapan administrasi pembelajaran sangat baik dan memenuhi standar Kurikulum Merdeka secara komprehensif. Dokumen tersusun rapi, asesmen diagnostik dan formatif terdokumentasi dengan sangat baik.",
    tindakLanjut: "Pertahankan kualitas administrasi dan dapat dijadikan contoh praktik baik (best practice) bagi rekan guru lainnya melalui komunitas belajar/MGMP sekolah."
  },
  {
    name: "ABDUL RAHMAN BAHSOAN",
    mapel: "Informatika / TIK",
    kelas: "X & XI",
    jtm: "24",
    tugasTambahan: "Kepala Lab Komputer",
    supervisor: "Drs. H. Abdul Rahman, M.Pd.",
    tanggal: "2026-09-08"
  },
  {
    name: "ABDULAZIS KARIM LABANGA",
    nip: "196701051994031016",
    mapel: "Pendidikan Pancasila",
    kelas: "XI /F",
    jtm: "24 jam",
    totalSkor: 60,
    supervisor: "Drs. JakubA. GuE",
    tanggal: "2026-08-24",
    catatan: "Secara umum administrasi perencanaan dan pelaksanaan pembelajaran sudah lengkap dan terstruktur dengan baik. Terdapat beberapa hal kecil yang perlu disempurnakan seperti keteraturan jurnal dan kisi-kisi asesmen.",
    tindakLanjut: "Melengkapi rubrik KKTP dan melampirkan tindak lanjut program remedial dan pengayaan pada pertemuan berkala."
  },
  {
    name: "ABDURRAHMAN ABDULLAH",
    tanggal: "2026-09-16"
  },
  {
    name: "AIS DJAFAR",
    mapel: "Bahasa Indonesia",
    kelas: "XII",
    jtm: "24",
    tugasTambahan: "Wali Kelas XII-A",
    supervisor: "Drs. H. Abdul Rahman, M.Pd.",
    tanggal: "2026-09-08"
  },
  {
    name: "ALVIAN LANTI",
    mapel: "Matematika",
    kelas: "XI MIPA",
    jtm: "28",
    tugasTambahan: "Pembina OSIS",
    totalSkor: 75,
    supervisor: "Drs. H. Abdul Rahman, M.Pd.",
    tanggal: "2026-09-08",
    catatan: "Sangat baik dalam analisis capaian pembelajaran dan modul ajar terdiferensiasi.",
    tindakLanjut: "Pertahankan dan bagikan modul ajar di PMM (Platform Merdeka Mengajar)."
  },
  {
    name: "AMNAH M. HASAN",
    nip: "196810061994032007 / 1338746648300003",
    mapel: "Bahasa Inggris",
    kelas: "XI / F",
    jtm: "24 jam",
    tugasTambahan: "WALI  KELAS",
    totalSkor: 71,
    supervisor: "Drs. Jakub A. GuE",
    tanggal: "2026-09-17",
    catatan: "Dokumen dilengkapi  pada tanggal 24 September 2016",
    tindakLanjut: "Pembinaan berkepanjutan"
  },
  {
    name: "ANA LASIMPALA",
    tanggal: "2026-09-16"
  },
  {
    name: "ANDRI RIZKI ROTINSULU",
    tanggal: "2026-09-16"
  },
  {
    name: "ASTI JULIA MANSI",
    tanggal: "2026-09-16"
  },
  {
    name: "AYUNITA TULIABU",
    tanggal: "2026-09-16"
  },
  {
    name: "DIANA ELITA",
    tanggal: "2026-09-16"
  },
  {
    name: "ENDANG H. USULI",
    tanggal: "2026-09-16"
  },
  {
    name: "ERNA ANDRIYANA VAN GOBEL",
    tanggal: "2026-09-16"
  },
  {
    name: "FARIDA RAHIM",
    mapel: "Bahasa Inggris",
    kelas: "X",
    jtm: "24",
    tugasTambahan: "Guru Piket",
    totalSkor: 51,
    supervisor: "Drs. H. Abdul Rahman, M.Pd.",
    tanggal: "2026-09-08",
    catatan: "Perangkat pembelajaran cukup lengkap, namun asesmen awal kognitif perlu diperbaharui.",
    tindakLanjut: "Mengikuti workshop penyusunan instrumen Asesmen Awal dan KKTP."
  },
  {
    name: "FATHRAH MIOLO",
    tanggal: "2026-09-16"
  },
  {
    name: "FATMA JUITA DATAU",
    tanggal: "2026-09-16"
  },
  {
    name: "FAZRION LITTI",
    tanggal: "2026-09-16"
  },
  {
    name: "FITRI ABDUL KADIR LUAWO",
    nip: "197310262003122004",
    mapel: "Kreativitas Inovatif dan Kewirausahaan",
    kelas: "XI,XII/F",
    jtm: "24 Jam",
    tugasTambahan: "Wali kelas",
    totalSkor: 71,
    supervisor: "Drs.Jakub A. Gue",
    tanggal: "2026-08-21",
    catatan: "Administrasi secara umum telah dipenuhi namun ada beberapa yang perlu dilengkapi",
    tindakLanjut: "Dokumen yang perlu ditindak lanjuti,segera saya penuhi dan segera diasistensi kembali."
  },
  {
    name: "HAINA POMALINGO",
    tanggal: "2026-09-17"
  },
  {
    name: "HARTINI VAN SOLANG",
    tanggal: "2026-09-17"
  },
  {
    name: "HARYANI BIGA",
    nip: "197203311996012001",
    mapel: "KONSENTRASI KEAHLIAN KULINER",
    kelas: "FASE F",
    jtm: "14",
    tugasTambahan: "WALI KELAS",
    totalSkor: 62,
    supervisor: "Drs. Jakub A. GuE",
    tanggal: "2026-08-18"
  },
  {
    name: "IDRUS AHMAD",
    tanggal: "2026-09-17"
  },
  {
    name: "IRFAN SYAHRUL BASRI",
    tanggal: "2026-09-17"
  },
  {
    name: "IRVAN I. KOBA",
    nip: "198410302010011003",
    mapel: "Pendidikan Jasmani Olahraga dan Kesehatan",
    kelas: "Fase E & F",
    jtm: "12 Jam",
    tugasTambahan: "Wakasek Kesiswaan",
    tanggal: "2026-09-17"
  },
  {
    name: "LA ODE RELY",
    tanggal: "2026-09-17"
  },
  {
    name: "LAZIJMATUL HILMA KAU",
    tanggal: "2026-09-17"
  },
  {
    name: "MARDIYAH HAYATI DAENG MULISA",
    tanggal: "2026-09-17"
  },
  {
    name: "MEMY RESTIANI ISHAK",
    tanggal: "2026-09-17"
  },
  {
    name: "MIRNAWATI ISMAIL",
    tanggal: "2026-09-17"
  },
  {
    name: "MUSDALIFAH",
    tanggal: "2026-09-17"
  },
  {
    name: "NAFTALYN ISA",
    tanggal: "2026-09-17"
  },
  {
    name: "NIKMA YAHYA",
    nip: "197009081995122003",
    mapel: "Produksi Pengolahan Herbal",
    kelas: "XI APHP 2",
    jtm: "4 Jam Pelajaran",
    tugasTambahan: "Wakasek Hubin",
    totalSkor: 61,
    tanggal: "2026-09-17"
  },
  {
    name: "NORMAWATY FAZRA A. LAYA",
    tanggal: "2026-09-17"
  },
  {
    name: "NURAIDA KADIR",
    nip: "198112232022212019/3555759661300053",
    mapel: "Tata Kecantikan dan Spa",
    kelas: "XI KECANTIKAN 2/F",
    jtm: "5",
    tugasTambahan: "KEPALA BENGKEL",
    totalSkor: 55,
    supervisor: "Drs. JAKUB A. GUE",
    tanggal: "2026-08-28"
  },
  {
    name: "NURHUDA PASISINGI",
    nip: "199010062019032006",
    mapel: "MATEMATIKA",
    kelas: "XI/ FASE F",
    jtm: "15 JP",
    tugasTambahan: "KETUA PROGRAM KEAHLIAN KECANTIKAN DAN SPA",
    totalSkor: 68,
    supervisor: "Drs. Jakub A Gue",
    tanggal: "2026-03-09",
    catatan: "Dokumen yang perlu dilengkapi : 1. Analisis Penialain Harian, 2. Buku Paket Segara digunakan",
    tindakLanjut: "Dokumen yang perlu ditindak lanjuti segera dipenuhi dan segera diasistensi kembali."
  },
  {
    name: "NURLAILA DODA",
    tanggal: "2026-09-17"
  },
  {
    name: "NURLELA MAMONTO",
    tanggal: "2026-09-17"
  },
  {
    name: "NURYANTI SOLEMAN",
    tanggal: "2026-09-17"
  },
  {
    name: "PATRIA WUMU",
    tanggal: "2026-09-17"
  },
  {
    name: "PUTRI VERONICA A. ABDUL",
    tanggal: "2026-09-17"
  },
  {
    name: "RAHAYU ABDUL",
    tanggal: "2026-09-17"
  },
  {
    name: "RAHMAH SAID",
    nip: "199003012019032005",
    mapel: "Pendidikan Agama Islam & Budi Pekerti",
    kelas: "X & XI/ Fase E & F",
    jtm: "30 Jam",
    tugasTambahan: "Wali Kelas",
    totalSkor: 67,
    supervisor: "Drs. Jakub A. Gue",
    tanggal: "2026-09-16",
    tindakLanjut: "Pembinaan"
  },
  {
    name: "RAMDHAN UMAR",
    tanggal: "2026-09-17"
  },
  {
    name: "RIAMTI BORA",
    nip: "197004152010012001",
    mapel: "Pendidikan Agama Islam dan Budi Pekerti",
    kelas: "X  fase E ",
    jtm: "24",
    totalSkor: 76,
    supervisor: "Drs.Jakub A.GuE",
    tanggal: "2026-09-30"
  },
  {
    name: "RINI YUSUF AHMAD",
    tanggal: "2026-09-17"
  },
  {
    name: "RITA IBRAHIM LIPUTO",
    tanggal: "2026-09-17"
  },
  {
    name: "RIZAL ABDUL",
    tanggal: "2026-09-17"
  },
  {
    name: "RODIFA CHOIRULLY",
    tanggal: "2026-09-17"
  },
  {
    name: "ROSTIN IGIRISA",
    nip: "198408152010012004/",
    mapel: "KK KULINER",
    kelas: "FASE F",
    jtm: "5 JAM",
    tugasTambahan: "WALI KELAS",
    totalSkor: 66,
    tanggal: "2026-09-16"
  },
  {
    name: "SARIFIN AHMAD",
    tanggal: "2026-09-17"
  },
  {
    name: "SATRIA RUCHBAN",
    tanggal: "2026-09-17"
  },
  {
    name: "SITTI SAHRA SANUSI",
    tanggal: "2026-09-17"
  },
  {
    name: "SRI DEWI HAMBA",
    mapel: "PKK",
    kelas: "XI/ FASE F",
    totalSkor: 17,
    tanggal: "2026-09-16"
  },
  {
    name: "SRI INDRAWATY NINGSIH KADIR",
    tanggal: "2026-09-17"
  },
  {
    name: "SRI MAHDALANA MACHMUD",
    tanggal: "2026-09-17"
  },
  {
    name: "SRI NINGSIH H. SUMOMBO",
    tanggal: "2026-09-17"
  },
  {
    name: "SRI RAHAYU HUSAIN",
    nip: "3550774675230243",
    mapel: "Sejarah ",
    kelas: "X, XI / FASE E & F",
    jtm: "24 Jam",
    tugasTambahan: "Wali kelas ",
    totalSkor: 71,
    supervisor: "Drs. Jakub A. GuE",
    tanggal: "2026-08-27",
    catatan: "Kelengkapan administrasi pembelajaran sangat baik dan memenuhi standar Kurikulum Merdeka secara komprehensif. Dokumen tersusun rapi, asesmen diagnostik dan formatif terdokumentasi dengan sangat baik.",
    tindakLanjut: "Pertahankan kualitas administrasi dan dapat dijadikan contoh praktik baik (best practice) bagi rekan guru lainnya melalui komunitas belajar/MGMP sekolah."
  },
  {
    name: "SUMARNI TARJO",
    tanggal: "2026-09-17"
  },
  {
    name: "SURIANTI DUNGGIO",
    tanggal: "2026-09-17"
  },
  {
    name: "SURIYONO SUMA",
    tanggal: "2026-09-17"
  },
  {
    name: "SURYANINGSI",
    nip: "198212292006042012",
    mapel: "Produktif Perhotelan (Front Office) ",
    kelas: "XI Perhotelan",
    jtm: "6 Jam",
    tugasTambahan: "Wali Kelas",
    totalSkor: 66,
    supervisor: "Drs.Jakub A. GuE",
    tanggal: "2026-08-21",
    catatan: "Secara umum administrasi sudah siap digunakan dalam proses KBM dan perlu kerapihan pada dokumen  asesmen perlu dilengkapi",
    tindakLanjut: "Guru harus siap  melengkapi  dokumen "
  },
  {
    name: "SURYAWAN AL BASYA",
    tanggal: "2026-09-17"
  },
  {
    name: "SYAHRUL RAMDHAN",
    nip: "199503012022211006",
    mapel: "INFORMATIKA",
    kelas: "X / E",
    jtm: "34",
    tugasTambahan: "Wali kelas",
    totalSkor: 65,
    supervisor: "Drs. Jakub A. Gue",
    tanggal: "2026-08-26",
    catatan: "Secara umum administrasi perencanaan dan pelaksanaan pembelajaran sudah lengkap dan terstruktur dengan baik. Terdapat beberapa hal kecil yang perlu disempurnakan seperti keteraturan jurnal dan kisi-kisi asesmen.",
    tindakLanjut: "Melengkapi rubrik KKTP dan melampirkan tindak lanjut program remedial dan pengayaan pada pertemuan berkala."
  },
  {
    name: "TOMY PRIYONO LAWANI",
    tanggal: "2026-09-17"
  },
  {
    name: "ULIN KASAN",
    tanggal: "2026-09-17"
  },
  {
    name: "WAHAB ALI",
    tanggal: "2026-09-17"
  },
  {
    name: "WIRNAWATY R. ISRA",
    nip: "197101262005012010",
    mapel: "Matematika",
    kelas: "X Hotel,X Kuliner,Hotel, XII Busana",
    jtm: "26 Jam",
    tugasTambahan: "-",
    totalSkor: 61,
    supervisor: "Drs. Jakub A. GuE",
    tanggal: "2026-09-16",
    catatan: "Dokumen yang belum di buat harus segera di buat dan dilengkapi sampai dengan tanggal 20 September",
    tindakLanjut: "Dokumen yang perlu di tindak lanjuti segera di penuhi dan segera di asestensi kembali"
  },
  {
    name: "YOLA SALEHE",
    nip: "196901162006042002",
    mapel: "Dasar - dasar Kejuruan APHP ",
    kelas: "X  APHP 2 /;E",
    jtm: "12 Jam",
    tugasTambahan: "Kepala Bengkel / Guru Wali / Piket",
    totalSkor: 72,
    supervisor: "Drs. Jakub A. GuE",
    tanggal: "2026-09-21"
  },
  {
    name: "YUNNIASTATI BADERAN",
    tanggal: "2026-09-17"
  },
  {
    name: "ZIKHARNI YUSUF",
    tanggal: "2026-09-17"
  },
  {
    name: "ZURIYATI SOLEMAN",
    tanggal: "2026-09-17"
  }
];

export function buildRestoredDataset(): {
  meta: SchoolMeta;
  teachers: string[];
  records: Record<string, SupervisionRecord>;
  index: SupervisionIndex;
} {
  const teachers = DEFAULT_TEACHERS.map(t => t.toUpperCase());
  const records: Record<string, SupervisionRecord> = {};
  const index: SupervisionIndex = {};

  const entriesMap = new Map<string, RestoredEntryRaw>();
  RESTORED_ENTRIES_RAW.forEach(e => {
    entriesMap.set(e.name.toUpperCase(), e);
  });

  teachers.forEach(teacher => {
    const slug = slugifyTeacher(teacher);
    const raw = entriesMap.get(teacher);
    const hasScores = typeof raw?.totalSkor === "number" && raw.totalSkor > 0;
    const scores = hasScores ? generateScoresForTotal(raw!.totalSkor!) : {};

    const rec: SupervisionRecord = {
      name: teacher,
      nip: raw?.nip || "",
      mapel: raw?.mapel || "",
      kelas: raw?.kelas || "",
      jtm: raw?.jtm || "",
      tugasTambahan: raw?.tugasTambahan || "",
      sertifikasi: "",
      driveUrl: "",
      scores,
      catatan: raw?.catatan || "",
      tindakLanjut: raw?.tindakLanjut || "",
      namaSupervisor: raw?.supervisor || RESTORED_SCHOOL_META.kepalaSekolah,
      nipSupervisor: RESTORED_SCHOOL_META.nipKepalaSekolah,
      tanggal: raw?.tanggal || "2026-09-16",
      updatedAt: hasScores ? `${raw?.tanggal || "2026-09-16"}T10:00:00.000Z` : null
    };

    records[slug] = rec;

    if (hasScores) {
      const summary = calculateScoreSummary(rec);
      index[slug] = {
        name: teacher,
        nip: rec.nip || "",
        mapel: rec.mapel || "",
        driveUrl: "",
        total: summary.total,
        count: summary.count,
        percentage: summary.percentage,
        predikatCls: summary.predikat.cls,
        predikatLabel: summary.predikat.label,
        updatedAt: rec.updatedAt
      };
    }
  });

  return {
    meta: RESTORED_SCHOOL_META,
    teachers,
    records,
    index
  };
}
