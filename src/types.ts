export interface IndicatorItem {
  no: number;
  nama: string;
  bukti: string[];
}

export interface SectionCategory {
  id: "A" | "B" | "C" | "D";
  title: string;
  items: IndicatorItem[];
}

export type ScoreValue = 0 | 1 | 2 | 3 | 4 | null;

export interface SupervisionRecord {
  name: string;
  nip?: string;
  mapel: string;
  kelas: string;
  jtm: string;
  tugasTambahan: string;
  sertifikasi: string;
  driveUrl?: string;
  scores: Record<number, ScoreValue>;
  catatan: string;
  tindakLanjut: string;
  namaSupervisor: string;
  nipSupervisor?: string;
  tanggal: string;
  updatedAt: string | null;
}

export interface SchoolMeta {
  sekolah: string;
  npsn?: string;
  alamat?: string;
  semester: string;
  tahun: string;
  kota: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  logoUrl?: string;
  // Kustomisasi Kop Surat & Logo
  kopType?: "text" | "image";
  kopImageUrl?: string;
  kopInstansi?: string;
  kopDinas?: string;
  kopSekolah?: string;
  kopAlamat?: string;
  kopKontak?: string;
  kopNpsnAkreditasi?: string;
  logoKananUrl?: string;
  showLogoKanan?: boolean;
}

export interface TeacherIndexItem {
  name: string;
  nip?: string;
  mapel: string;
  driveUrl?: string;
  total: number | null;
  count: number;
  percentage: number | null;
  predikatCls: "ab" | "b" | "c" | "k" | "z";
  predikatLabel: string;
  updatedAt: string | null;
}

export type SupervisionIndex = Record<string, TeacherIndexItem>;

export interface PredikatInfo {
  label: string;
  grade: string;
  cls: "ab" | "b" | "c" | "k" | "z";
  desc: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export type ActiveTab = "input" | "rekap" | "print" | "analisis";
