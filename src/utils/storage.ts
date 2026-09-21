import { SchoolMeta, SupervisionIndex, SupervisionRecord, TeacherIndexItem } from "../types";
import { DEFAULT_TEACHERS, createBlankRecord, slugifyTeacher, calculateScoreSummary } from "../data/supervisionData";
import { RESTORED_SCHOOL_META, buildRestoredDataset } from "../data/restoredSeedData";

const STORAGE_KEYS = {
  INDEX: "sup_v2_index",
  SCHOOL_META: "sup_v2_school_meta",
  TEACHERS_LIST: "sup_v2_teachers_list",
  RECORD_PREFIX: "sup_v2_rec:"
};

export const DEFAULT_SCHOOL_META: SchoolMeta = { ...RESTORED_SCHOOL_META };

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

/**
 * Detection for dummy placeholder teachers like "GURU 1", "GURU 2", "GURU-1", etc.
 */
export function isDummyTeacher(name?: string | null): boolean {
  if (!name) return false;
  const trimmed = String(name).trim().toUpperCase();
  // Matches "GURU 1", "GURU 2", "GURU 01", "GURU-1", "GURU_1", "GURU1", etc.
  if (/^GURU[\s\-_]*\d+/i.test(trimmed)) return true;
  if (/^GURU\s+[IVXLCDM]+/i.test(trimmed)) return true;
  if (trimmed === "GURU" || trimmed === "GURU BARU" || trimmed === "DUMMY" || trimmed === "SAMPLE") return true;
  return false;
}

export function isDummySlug(slug?: string | null): boolean {
  if (!slug) return false;
  const s = String(slug).trim().toLowerCase();
  if (/^guru[\-_]?\d+/i.test(s)) return true;
  if (/^guru[\-_]?[ivxlcdm]+/i.test(s)) return true;
  if (s === "guru" || s === "guru-baru" || s === "dummy" || s === "sample") return true;
  return false;
}

export function getTeachersList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed
          .map((t: string) => String(t).toUpperCase().trim())
          .filter(t => t && !isDummyTeacher(t));
        if (cleaned.length > 0) {
          return cleaned;
        }
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
    const upperList = list
      .map(t => String(t).trim().toUpperCase())
      .filter(t => t && !isDummyTeacher(t));
    const finalList = upperList.length > 0 ? upperList : DEFAULT_TEACHERS.map(t => t.toUpperCase());
    localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(finalList));
  } catch (err) {
    console.error("Failed to save teachers list to localStorage", err);
  }
}

export function getSupervisionIndex(): SupervisionIndex {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleaned: SupervisionIndex = {};
      Object.keys(parsed).forEach(k => {
        if (!isDummySlug(k) && !isDummyTeacher(parsed[k]?.name)) {
          cleaned[k] = parsed[k];
        }
      });
      return cleaned;
    }
  } catch (err) {
    console.warn("Failed to load supervision index from localStorage", err);
  }
  return {};
}

export function saveSupervisionIndex(index: SupervisionIndex): void {
  try {
    const cleaned: SupervisionIndex = {};
    Object.keys(index).forEach(k => {
      if (!isDummySlug(k) && !isDummyTeacher(index[k]?.name)) {
        cleaned[k] = index[k];
      }
    });
    localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(cleaned));
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

    if (summary.count > 0 || updatedRecord.driveUrl) {
      index[slug] = {
        name: upperName,
        nip: updatedRecord.nip || "",
        mapel: updatedRecord.mapel || "",
        driveUrl: updatedRecord.driveUrl || "",
        total: summary.count > 0 ? summary.total : null,
        count: summary.count,
        percentage: summary.count > 0 ? summary.percentage : null,
        predikatCls: summary.count > 0 ? summary.predikat.cls : "z",
        predikatLabel: summary.count > 0 ? summary.predikat.label : "Belum Disupervisi",
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
    restoreCsvSeedData(true);
  } catch (err) {
    console.error("Failed to reset data", err);
  }
}

/**
 * Purges all dummy placeholder teachers (like GURU 1..N) from localStorage, index, and records,
 * and restores the verified 72 teachers of SMKN 2 Gorontalo with their authentic evaluation records.
 */
export function purgeDummyDataAndRestoreOriginalTeachers(): { teachers: string[]; index: SupervisionIndex } {
  try {
    // 1. Remove all dummy records from localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.RECORD_PREFIX)) {
        const slug = key.replace(STORAGE_KEYS.RECORD_PREFIX, "");
        if (isDummySlug(slug)) {
          keysToRemove.push(key);
        } else {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const rec = JSON.parse(raw);
              if (isDummyTeacher(rec?.name)) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {}
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 2. Clear out dummy entries from index
    const rawIndex = localStorage.getItem(STORAGE_KEYS.INDEX);
    const cleanIndex: SupervisionIndex = {};
    if (rawIndex) {
      try {
        const parsed = JSON.parse(rawIndex);
        Object.keys(parsed).forEach(k => {
          if (!isDummySlug(k) && !isDummyTeacher(parsed[k]?.name)) {
            cleanIndex[k] = parsed[k];
          }
        });
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(cleanIndex));

    // 3. Reset teachers list strictly to DEFAULT_TEACHERS (the 72 verified original teachers)
    const upperDefault = DEFAULT_TEACHERS.map(t => t.toUpperCase());
    localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(upperDefault));

    // 4. Restore the verified seed evaluations from SMKN 2 Gorontalo for the 72 teachers
    restoreCsvSeedData(true);

    return {
      teachers: getTeachersList(),
      index: getSupervisionIndex()
    };
  } catch (err) {
    console.error("Failed to purge dummy data and restore original teachers", err);
    return { teachers: DEFAULT_TEACHERS.map(t => t.toUpperCase()), index: {} };
  }
}

// Auto cleanup legacy sample records if any existed from previous demonstration and ensure uppercase teachers
export function cleanupLegacyDummyData(): void {
  try {
    // Check if any dummy teachers exist in localStorage
    let hasDummy = false;
    const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS_LIST);
    if (rawTeachers) {
      try {
        const list = JSON.parse(rawTeachers);
        if (Array.isArray(list) && list.some(t => isDummyTeacher(t))) {
          hasDummy = true;
        }
      } catch (e) {}
    }

    const rawIndex = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (rawIndex) {
      try {
        const parsed = JSON.parse(rawIndex);
        if (Object.keys(parsed).some(k => isDummySlug(k) || isDummyTeacher(parsed[k]?.name))) {
          hasDummy = true;
        }
      } catch (e) {}
    }

    // Also check if any record key is dummy
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEYS.RECORD_PREFIX)) {
        const slug = k.replace(STORAGE_KEYS.RECORD_PREFIX, "");
        if (isDummySlug(slug)) {
          hasDummy = true;
          break;
        }
      }
    }

    if (hasDummy) {
      console.log("[Storage] Dummy teachers detected. Purging dummy data and restoring original 72 teachers...");
      purgeDummyDataAndRestoreOriginalTeachers();
      return;
    }

    // Ensure all stored teachers are uppercase
    if (rawTeachers) {
      try {
        const list = JSON.parse(rawTeachers);
        if (Array.isArray(list) && list.length > 0) {
          const upperList = list.map(t => String(t).trim().toUpperCase()).filter(t => !isDummyTeacher(t));
          localStorage.setItem(STORAGE_KEYS.TEACHERS_LIST, JSON.stringify(upperList));
        }
      } catch (e) {}
    }

    // Ensure all index entries have uppercase names
    if (rawIndex) {
      try {
        const parsed = JSON.parse(rawIndex);
        let changed = false;
        Object.keys(parsed).forEach(k => {
          if (isDummySlug(k) || isDummyTeacher(parsed[k]?.name)) {
            delete parsed[k];
            changed = true;
          } else if (parsed[k]?.name && parsed[k].name !== parsed[k].name.toUpperCase()) {
            parsed[k].name = parsed[k].name.toUpperCase();
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    // Restore full dataset if index is empty or previously wiped
    const restored = restoreCsvSeedData(false);
    if (restored > 0) {
      console.log(`[Storage] Restored ${restored} teacher evaluation records from CSV seed.`);
    }
  } catch (err) {
    console.warn("Cleanup legacy dummy data failed", err);
  }
}

/**
 * Restores the complete CSV dataset (72 teachers and all 22 evaluated records)
 * If force is false, it only populates records that are empty or missing, never overwriting existing evaluations.
 */
export function restoreCsvSeedData(force = false): number {
  try {
    const dataset = buildRestoredDataset();
    const currentIndex = getSupervisionIndex();
    const currentTeachers = getTeachersList();
    const currentMeta = getSchoolMeta();

    // 1. Ensure school meta has SMKN 2 Gorontalo and Kop data
    const updatedMeta: SchoolMeta = {
      ...dataset.meta,
      ...currentMeta,
      sekolah: currentMeta.sekolah || dataset.meta.sekolah,
      kepalaSekolah: currentMeta.kepalaSekolah || dataset.meta.kepalaSekolah,
      nipKepalaSekolah: currentMeta.nipKepalaSekolah || dataset.meta.nipKepalaSekolah,
      kopInstansi: currentMeta.kopInstansi || dataset.meta.kopInstansi,
      kopDinas: currentMeta.kopDinas || dataset.meta.kopDinas,
      kopSekolah: currentMeta.kopSekolah || dataset.meta.kopSekolah,
      kopAlamat: currentMeta.kopAlamat || dataset.meta.kopAlamat,
      kopKontak: currentMeta.kopKontak || dataset.meta.kopKontak,
      kopNpsnAkreditasi: currentMeta.kopNpsnAkreditasi || dataset.meta.kopNpsnAkreditasi,
      logoUrl: currentMeta.logoUrl || dataset.meta.logoUrl,
      kopType: currentMeta.kopType || dataset.meta.kopType || "text"
    };
    saveSchoolMeta(updatedMeta);

    // 2. Ensure all 72 teachers exist (strictly excluding dummy teachers)
    const teacherSet = new Set<string>();
    const mergedTeachers: string[] = [];
    dataset.teachers.forEach(t => {
      const u = t.trim().toUpperCase();
      if (!isDummyTeacher(u) && !teacherSet.has(u)) {
        teacherSet.add(u);
        mergedTeachers.push(u);
      }
    });
    currentTeachers.forEach(t => {
      const u = t.trim().toUpperCase();
      if (!isDummyTeacher(u) && !teacherSet.has(u)) {
        teacherSet.add(u);
        mergedTeachers.push(u);
      }
    });
    saveTeachersList(mergedTeachers);

    // 3. Restore records and index
    let restoredCount = 0;
    const newIndex: SupervisionIndex = {};
    // Only keep non-dummy entries from currentIndex
    Object.keys(currentIndex).forEach(k => {
      if (!isDummySlug(k) && !isDummyTeacher(currentIndex[k]?.name)) {
        newIndex[k] = currentIndex[k];
      }
    });

    dataset.teachers.forEach(teacher => {
      if (isDummyTeacher(teacher)) return;
      const slug = slugifyTeacher(teacher);
      const seedRec = dataset.records[slug];
      if (!seedRec) return;

      const rawExisting = localStorage.getItem(STORAGE_KEYS.RECORD_PREFIX + slug);
      let shouldRestore = force || !rawExisting;

      if (rawExisting && !force) {
        try {
          const parsed = JSON.parse(rawExisting) as SupervisionRecord;
          const hasScores = parsed.scores && Object.values(parsed.scores).some(v => typeof v === "number" && v > 0);
          const hasNotes = Boolean(parsed.catatan?.trim() || parsed.tindakLanjut?.trim() || parsed.driveUrl?.trim());
          // If local record has no scores/notes but seed has scores/notes, restore it!
          const seedHasScores = seedRec.scores && Object.values(seedRec.scores).some(v => typeof v === "number" && v > 0);
          if (!hasScores && !hasNotes && (seedHasScores || seedRec.mapel || seedRec.nip)) {
            shouldRestore = true;
          }
        } catch (e) {
          shouldRestore = true;
        }
      }

      if (shouldRestore) {
        saveTeacherRecord(seedRec);
        const summary = calculateScoreSummary(seedRec);
        if (summary.count > 0 || seedRec.driveUrl) {
          newIndex[slug] = {
            name: teacher,
            nip: seedRec.nip || "",
            mapel: seedRec.mapel || "",
            driveUrl: seedRec.driveUrl || "",
            total: summary.count > 0 ? summary.total : null,
            count: summary.count,
            percentage: summary.count > 0 ? summary.percentage : null,
            predikatCls: summary.count > 0 ? summary.predikat.cls : "z",
            predikatLabel: summary.count > 0 ? summary.predikat.label : "Belum Disupervisi",
            updatedAt: seedRec.updatedAt || new Date().toISOString()
          };
          restoredCount++;
        }
      }
    });

    saveSupervisionIndex(newIndex);
    return restoredCount;
  } catch (err) {
    console.error("Failed to restore CSV seed data", err);
    return 0;
  }
}

/**
 * Fully deletes a single teacher and their evaluation record
 */
export function deleteTeacherEntirely(teacherName: string): { teachers: string[]; index: SupervisionIndex } {
  const upperName = teacherName.trim().toUpperCase();
  const slug = slugifyTeacher(upperName);
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORD_PREFIX + slug);
    const index = getSupervisionIndex();
    delete index[slug];
    saveSupervisionIndex(index);
    const teachers = getTeachersList().filter(t => t !== upperName);
    saveTeachersList(teachers);
    return { teachers, index };
  } catch (err) {
    console.error(`Failed to delete teacher ${upperName}`, err);
    return { teachers: getTeachersList(), index: getSupervisionIndex() };
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

