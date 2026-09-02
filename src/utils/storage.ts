import { SchoolMeta, SupervisionIndex, SupervisionRecord, TeacherIndexItem } from "../types";
import { DEFAULT_TEACHERS, createBlankRecord, slugifyTeacher, calculateScoreSummary } from "../data/supervisionData";

const STORAGE_KEYS = {
  INDEX: "sup_v2_index",
  SCHOOL_META: "sup_v2_school_meta",
  TEACHERS_LIST: "sup_v2_teachers_list",
  RECORD_PREFIX: "sup_v2_rec:"
};

export const DEFAULT_SCHOOL_META: SchoolMeta = {
  sekolah: "SMA Negeri 1 Teladan",
  npsn: "40201020",
  alamat: "Jl. Pendidikan No. 45",
  semester: "Genap",
  tahun: "2026/2027",
  kota: "Gorontalo",
  kepalaSekolah: "Drs. H. Abdul Rahman, M.Pd.",
  nipKepalaSekolah: "19720415 199802 1 002"
};

export function getSchoolMeta(): SchoolMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_META);
    if (raw) {
      return { ...DEFAULT_SCHOOL_META, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn("Failed to load school meta from localStorage", err);
  }
  return DEFAULT_SCHOOL_META;
}

export function saveSchoolMeta(meta: SchoolMeta): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_META, JSON.stringify(meta));
  } catch (err) {
    console.error("Failed to save school meta to localStorage", err);
  }
}

export function getTeachersList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load teachers list from localStorage", err);
  }
  // Initialize with default 72 teachers
  saveTeachersList(DEFAULT_TEACHERS);
  return DEFAULT_TEACHERS;
}

export function saveTeachersList(list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save teachers list to localStorage", err);
  }
}

export function getSupervisionIndex(): SupervisionIndex {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to load supervision index from localStorage", err);
  }
  return {};
}

export function saveSupervisionIndex(index: SupervisionIndex): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(index));
  } catch (err) {
    console.error("Failed to save supervision index to localStorage", err);
  }
}

export function getTeacherRecord(name: string, schoolMeta?: SchoolMeta): SupervisionRecord {
  const slug = slugifyTeacher(name);
  const meta = schoolMeta || getSchoolMeta();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORD_PREFIX + slug);
    if (raw) {
      const rec = JSON.parse(raw);
      return {
        ...createBlankRecord(name, meta.kepalaSekolah, meta.nipKepalaSekolah),
        ...rec,
        name // ensure name matches
      };
    }
  } catch (err) {
    console.warn(`Failed to load record for ${name}`, err);
  }

  return createBlankRecord(name, meta.kepalaSekolah, meta.nipKepalaSekolah);
}

export function saveTeacherRecord(record: SupervisionRecord): SupervisionIndex {
  const slug = slugifyTeacher(record.name);
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now
  };

  try {
    localStorage.setItem(STORAGE_KEYS.RECORD_PREFIX + slug, JSON.stringify(updatedRecord));

    const summary = calculateScoreSummary(updatedRecord);
    const index = getSupervisionIndex();

    if (summary.count > 0) {
      index[slug] = {
        name: updatedRecord.name,
        nip: updatedRecord.nip || "",
        mapel: updatedRecord.mapel || "",
        total: summary.total,
        count: summary.count,
        percentage: summary.percentage,
        predikatCls: summary.predikat.cls,
        predikatLabel: summary.predikat.label,
        updatedAt: now
      };
    } else {
      delete index[slug];
    }

    saveSupervisionIndex(index);
    return index;
  } catch (err) {
    console.error(`Failed to save record for ${record.name}`, err);
    return getSupervisionIndex();
  }
}

export function deleteTeacherRecord(name: string): SupervisionIndex {
  const slug = slugifyTeacher(name);
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORD_PREFIX + slug);
    const index = getSupervisionIndex();
    delete index[slug];
    saveSupervisionIndex(index);
    return index;
  } catch (err) {
    console.error(`Failed to delete record for ${name}`, err);
    return getSupervisionIndex();
  }
}

export function exportAllDataAsJSON(): string {
  const meta = getSchoolMeta();
  const teachers = getTeachersList();
  const index = getSupervisionIndex();
  const records: Record<string, SupervisionRecord> = {};

  teachers.forEach(teacher => {
    const slug = slugifyTeacher(teacher);
    if (index[slug]) {
      records[slug] = getTeacherRecord(teacher);
    }
  });

  const exportPayload = {
    version: "2.0",
    exportDate: new Date().toISOString(),
    schoolMeta: meta,
    teachers,
    index,
    records
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function importDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.schoolMeta) {
      saveSchoolMeta(parsed.schoolMeta);
    }
    if (Array.isArray(parsed.teachers) && parsed.teachers.length > 0) {
      saveTeachersList(parsed.teachers);
    }
    if (parsed.records) {
      Object.keys(parsed.records).forEach(slug => {
        const rec = parsed.records[slug];
        localStorage.setItem(STORAGE_KEYS.RECORD_PREFIX + slug, JSON.stringify(rec));
      });
    }
    if (parsed.index) {
      saveSupervisionIndex(parsed.index);
    }
    return true;
  } catch (err) {
    console.error("Failed to import data from JSON", err);
    return false;
  }
}

export function resetAllDataToDefault(): void {
  try {
    localStorage.clear();
    saveSchoolMeta(DEFAULT_SCHOOL_META);
    saveTeachersList(DEFAULT_TEACHERS);
    saveSupervisionIndex({});
  } catch (err) {
    console.error("Failed to reset data", err);
  }
}

// Helper to seed a few realistic sample records for demonstration if desired
export function seedSampleRecordsIfEmpty(): void {
  const index = getSupervisionIndex();
  if (Object.keys(index).length === 0) {
    const samples = [
      { name: "Abdul Rahman Bahsoan", mapel: "Informatika / TIK", kelas: "X & XI", jtm: "24", tugas: "Kepala Lab Komputer", sertif: "Teknik Informatika / 2018", scores: [4,4,4,4,4,4,4,3,4,4,4,4,3,3,4,4,3,4,4], catatan: "Perangkat administrasi sangat rapi dan lengkap berbasis LMS & Google Workspace.", tindakLanjut: "Dapat menjadi narasumber pengimbasan pemanfaatan media digital di Kombel." },
      { name: "Ais Djafar", mapel: "Bahasa Indonesia", kelas: "XII", jtm: "24", tugas: "Wali Kelas XII-A", sertif: "Pendidikan Bahasa Indonesia / 2015", scores: [4,3,4,3,4,4,3,3,4,3,4,3,3,3,3,3,2,4,3], catatan: "Administrasi tersusun baik. Rencana asesmen sumatif terprogram jelas.", tindakLanjut: "Perlu melengkapi rubrik deskriptif pada instrumen penilaian harian." },
      { name: "Alvian Lanti", mapel: "Matematika", kelas: "XI MIPA", jtm: "28", tugas: "Pembina OSIS", sertif: "Pendidikan Matematika / 2020", scores: [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3,4,4], catatan: "Sangat baik dalam analisis capaian pembelajaran dan modul ajar terdiferensiasi.", tindakLanjut: "Pertahankan dan bagikan modul ajar di PMM (Platform Merdeka Mengajar)." },
      { name: "Farida Rahim", mapel: "Bahasa Inggris", kelas: "X", jtm: "24", tugas: "Guru Piket", sertif: "Pendidikan Bahasa Inggris / 2017", scores: [3,3,3,2,3,3,3,2,4,3,3,3,2,2,2,3,2,3,2], catatan: "Perangkat pembelajaran cukup lengkap, namun asesmen awal kognitif perlu diperbaharui.", tindakLanjut: "Mengikuti workshop penyusunan instrumen Asesmen Awal dan KKTP." }
    ];

    const meta = getSchoolMeta();
    samples.forEach(s => {
      const rec = createBlankRecord(s.name, meta.kepalaSekolah, meta.nipKepalaSekolah);
      rec.mapel = s.mapel;
      rec.kelas = s.kelas;
      rec.jtm = s.jtm;
      rec.tugasTambahan = s.tugas;
      rec.sertifikasi = s.sertif;
      rec.catatan = s.catatan;
      rec.tindakLanjut = s.tindakLanjut;
      s.scores.forEach((val, idx) => {
        rec.scores[idx + 1] = val as 0 | 1 | 2 | 3 | 4;
      });
      saveTeacherRecord(rec);
    });
  }
}
