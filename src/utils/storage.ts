import { SchoolMeta, SupervisionIndex, SupervisionRecord, TeacherIndexItem } from "../types";
import { DEFAULT_TEACHERS, createBlankRecord, slugifyTeacher, calculateScoreSummary } from "../data/supervisionData";

const STORAGE_KEYS = {
  INDEX: "sup_v2_index",
  SCHOOL_META: "sup_v2_school_meta",
  TEACHERS_LIST: "sup_v2_teachers_list",
  RECORD_PREFIX: "sup_v2_rec:"
};

export const DEFAULT_SCHOOL_META: SchoolMeta = {
  sekolah: "SMKN 2 Gorontalo",
  npsn: "40501083",
  alamat: "Kota Gorontalo",
  semester: "Ganjil",
  tahun: "2026/2027",
  kota: "Gorontalo",
  kepalaSekolah: "",
  nipKepalaSekolah: ""
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
        return parsed.map((t: string) => String(t).toUpperCase());
      }
    }
  } catch (err) {
    console.warn("Failed to load teachers list from localStorage", err);
  }
  // Initialize with default 72 teachers (all uppercase)
  const upperTeachers = DEFAULT_TEACHERS.map(t => t.toUpperCase());
  saveTeachersList(upperTeachers);
  return upperTeachers;
}

export function saveTeachersList(list: string[]): void {
  try {
    const upperList = list.map(t => String(t).trim().toUpperCase());
    localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(upperList));
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
  const upperName = name.trim().toUpperCase();
  const slug = slugifyTeacher(upperName);
  const meta = schoolMeta || getSchoolMeta();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORD_PREFIX + slug);
    if (raw) {
      const rec = JSON.parse(raw);
      return {
        ...createBlankRecord(upperName, meta.kepalaSekolah, meta.nipKepalaSekolah),
        ...rec,
        name: upperName // ensure uppercase name
      };
    }
  } catch (err) {
    console.warn(`Failed to load record for ${upperName}`, err);
  }

  return createBlankRecord(upperName, meta.kepalaSekolah, meta.nipKepalaSekolah);
}

export function saveTeacherRecord(record: SupervisionRecord): SupervisionIndex {
  const upperName = record.name.trim().toUpperCase();
  const slug = slugifyTeacher(upperName);
  const now = new Date().toISOString();
  const updatedRecord: SupervisionRecord = {
    ...record,
    name: upperName,
    updatedAt: now
  };

  try {
    localStorage.setItem(STORAGE_KEYS.RECORD_PREFIX + slug, JSON.stringify(updatedRecord));

    const summary = calculateScoreSummary(updatedRecord);
    const index = getSupervisionIndex();

    if (summary.count > 0) {
      index[slug] = {
        name: upperName,
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
      saveTeachersList(parsed.teachers.map((t: string) => String(t).trim().toUpperCase()));
    }
    if (parsed.records) {
      Object.keys(parsed.records).forEach(slug => {
        const rec = parsed.records[slug];
        if (rec && rec.name) {
          rec.name = rec.name.trim().toUpperCase();
        }
        localStorage.setItem(STORAGE_KEYS.RECORD_PREFIX + slug, JSON.stringify(rec));
      });
    }
    if (parsed.index) {
      const upperIndex: SupervisionIndex = {};
      Object.keys(parsed.index).forEach(k => {
        const item = parsed.index[k];
        upperIndex[k] = {
          ...item,
          name: item.name ? item.name.trim().toUpperCase() : item.name
        };
      });
      saveSupervisionIndex(upperIndex);
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

// Auto cleanup legacy sample records if any existed from previous demonstration and ensure uppercase teachers
export function cleanupLegacyDummyData(): void {
  try {
    // Ensure all stored teachers are uppercase
    const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS_LIST);
    if (rawTeachers) {
      try {
        const list = JSON.parse(rawTeachers);
        if (Array.isArray(list) && list.length > 0) {
          const upperList = list.map(t => String(t).trim().toUpperCase());
          localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(upperList));
        }
      } catch (e) {}
    }

    // Ensure all index entries have uppercase names
    const rawIndex = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (rawIndex) {
      try {
        const parsed = JSON.parse(rawIndex);
        let changed = false;
        Object.keys(parsed).forEach(k => {
          if (parsed[k]?.name && parsed[k].name !== parsed[k].name.toUpperCase()) {
            parsed[k].name = parsed[k].name.toUpperCase();
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    const isCleaned = localStorage.getItem("sup_cleaned_dummy_v1");
    if (!isCleaned) {
      // Check if school meta still has the old mock school
      const rawMeta = localStorage.getItem(STORAGE_KEYS.SCHOOL_META);
      if (rawMeta && rawMeta.includes("SMA Negeri 1 Teladan")) {
        saveSchoolMeta(DEFAULT_SCHOOL_META);
      }

      // Check if stored records contain only the sample seed records
      if (rawIndex) {
        const parsed = JSON.parse(rawIndex);
        const keys = Object.keys(parsed);
        const sampleSlugs = ["abdul-rahman-bahsoan", "ais-djafar", "alvian-lanti", "farida-rahim"];
        const onlySamples = keys.length > 0 && keys.every(k => sampleSlugs.includes(k));
        
        if (onlySamples) {
          sampleSlugs.forEach(slug => {
            localStorage.removeItem(STORAGE_KEYS.RECORD_PREFIX + slug);
          });
          saveSupervisionIndex({});
        }
      }

      localStorage.setItem("sup_cleaned_dummy_v1", "true");
    }
  } catch (err) {
    console.warn("Cleanup legacy dummy data failed", err);
  }
}

// Clear all evaluation records and reset scores
export function clearAllSupervisionRecords(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(STORAGE_KEYS.RECORD_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
    saveSupervisionIndex({});
  } catch (err) {
    console.error("Failed to clear supervision records", err);
  }
}

// Clear or reset teachers list
export function clearAllTeachers(): void {
  try {
    saveTeachersList([]);
    clearAllSupervisionRecords();
  } catch (err) {
    console.error("Failed to clear teachers", err);
  }
}

