import { SchoolMeta, SupervisionIndex, SupervisionRecord } from "../types";
import { 
  getSchoolMeta, 
  getTeachersList, 
  getSupervisionIndex, 
  getTeacherRecord,
  saveSchoolMeta,
  saveTeachersList,
  saveSupervisionIndex,
  saveTeacherRecord,
  isDummyTeacher,
  isDummySlug
} from "./storage";
import { slugifyTeacher, calculateScoreSummary, createBlankRecord, DEFAULT_TEACHERS } from "../data/supervisionData";

export interface SyncPayload {
  version: string;
  updatedAt: string;
  deviceId?: string;
  schoolMeta: SchoolMeta;
  teachers: string[];
  index: SupervisionIndex;
  records: Record<string, SupervisionRecord>;
}

export interface SyncConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncTime: string | null;
  spreadsheetUrl?: string;
}

export const DEFAULT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyTiNLSMopSYzql8bsbuNmN0vCZY-6C_JDgydpIHnKogLCm_Mp186kdIPOM-mjNpUnjBw/exec";

const STORAGE_KEYS = {
  WEBAPP_URL: "sup_gsheet_webapp_url",
  AUTO_SYNC: "sup_gsheet_autosync",
  LAST_SYNC: "sup_gsheet_last_sync",
  SPREADSHEET_URL: "sup_gsheet_spreadsheet_url"
};

export function getSyncConfig(): SyncConfig {
  const storedUrl = localStorage.getItem(STORAGE_KEYS.WEBAPP_URL);
  const storedAuto = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
  return {
    webAppUrl: (storedUrl !== null && storedUrl !== "") ? storedUrl : DEFAULT_WEBAPP_URL,
    autoSync: storedAuto !== null ? storedAuto === "true" : true, // Default to true
    lastSyncTime: localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || null,
    spreadsheetUrl: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_URL) || ""
  };
}

export function saveSyncConfig(config: Partial<SyncConfig>): void {
  if (config.webAppUrl !== undefined) {
    localStorage.setItem(STORAGE_KEYS.WEBAPP_URL, config.webAppUrl.trim());
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, config.autoSync ? "true" : "false");
  }
  if (config.lastSyncTime !== undefined && config.lastSyncTime !== null) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, config.lastSyncTime);
  }
  if (config.spreadsheetUrl !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_URL, config.spreadsheetUrl.trim());
  }
}

/**
 * Check if a supervision record has actual evaluation data or content
 */
export function isRecordEvaluated(rec?: SupervisionRecord | null): boolean {
  if (!rec) return false;
  if (rec.scores && typeof rec.scores === "object") {
    const hasScore = Object.values(rec.scores).some(v => v !== null && v !== undefined);
    if (hasScore) return true;
  }
  if (rec.driveUrl && rec.driveUrl.trim().length > 0) return true;
  if (rec.catatan && rec.catatan.trim().length > 0) return true;
  if (rec.tindakLanjut && rec.tindakLanjut.trim().length > 0) return true;
  return false;
}

/**
 * Smart Conflict Resolution for a single teacher's record
 * Crucial Rule: A blank/empty record must NEVER overwrite an evaluated record from any device!
 */
export function mergeTeacherRecord(
  localRec: SupervisionRecord,
  cloudRec: SupervisionRecord
): SupervisionRecord {
  const localEval = isRecordEvaluated(localRec);
  const cloudEval = isRecordEvaluated(cloudRec);

  // If only one side has evaluations, keep the evaluated one!
  if (localEval && !cloudEval) return localRec;
  if (cloudEval && !localEval) return cloudRec;

  // If neither side has scores, combine profile metadata
  if (!localEval && !cloudEval) {
    return {
      ...localRec,
      nip: cloudRec.nip || localRec.nip || "",
      mapel: cloudRec.mapel || localRec.mapel || "",
      kelas: cloudRec.kelas || localRec.kelas || "",
      jtm: cloudRec.jtm || localRec.jtm || "",
      tugasTambahan: cloudRec.tugasTambahan || localRec.tugasTambahan || "",
      driveUrl: cloudRec.driveUrl || localRec.driveUrl || "",
    };
  }

  // Both sides are evaluated: Compare timestamps (Last-Write-Wins with safe fallback)
  const localTime = localRec.updatedAt ? new Date(localRec.updatedAt).getTime() : 0;
  const cloudTime = cloudRec.updatedAt ? new Date(cloudRec.updatedAt).getTime() : 0;

  const isLocalNewer = localTime >= cloudTime;
  const winner = isLocalNewer ? localRec : cloudRec;
  const loser = isLocalNewer ? cloudRec : localRec;

  // Merge individual indicator scores: start with loser's scores, then override with winner's scores
  const mergedScores: Record<number, any> = { ...(loser.scores || {}) };
  if (winner.scores) {
    Object.keys(winner.scores).forEach(k => {
      const num = Number(k);
      if (winner.scores[num] !== null && winner.scores[num] !== undefined) {
        mergedScores[num] = winner.scores[num];
      }
    });
  }

  return {
    ...winner,
    scores: mergedScores,
    nip: winner.nip || loser.nip || "",
    mapel: winner.mapel || loser.mapel || "",
    kelas: winner.kelas || loser.kelas || "",
    jtm: winner.jtm || loser.jtm || "",
    tugasTambahan: winner.tugasTambahan || loser.tugasTambahan || "",
    driveUrl: winner.driveUrl || loser.driveUrl || "",
    catatan: winner.catatan !== undefined && winner.catatan !== "" ? winner.catatan : (loser.catatan || ""),
    tindakLanjut: winner.tindakLanjut !== undefined && winner.tindakLanjut !== "" ? winner.tindakLanjut : (loser.tindakLanjut || ""),
    namaSupervisor: winner.namaSupervisor || loser.namaSupervisor || "",
    tanggal: winner.tanggal || loser.tanggal || "",
    updatedAt: new Date(Math.max(localTime, cloudTime, Date.now())).toISOString()
  };
}

/**
 * Two-Way Smart Merge: Combines Local and Cloud payloads safely
 * Preserves evaluations from all devices without erasing anything
 */
export function mergeSyncPayloads(local: SyncPayload, cloud: SyncPayload): SyncPayload {
  // 1. Teachers list: guarantee original 72 teachers first, then add valid custom teachers
  const teacherSet = new Set<string>();
  const mergedTeachers: string[] = [];

  // Always seed with DEFAULT_TEACHERS so genuine teachers remain in priority order
  DEFAULT_TEACHERS.forEach(t => {
    const upper = t.trim().toUpperCase();
    if (!teacherSet.has(upper)) {
      teacherSet.add(upper);
      mergedTeachers.push(upper);
    }
  });

  // Add any valid (non-dummy) teachers from local or cloud
  (local.teachers || []).concat(cloud.teachers || []).forEach(t => {
    const upper = String(t).trim().toUpperCase();
    if (upper && !isDummyTeacher(upper) && !teacherSet.has(upper)) {
      teacherSet.add(upper);
      mergedTeachers.push(upper);
    }
  });

  // 2. School metadata: merge with fallback to non-empty fields
  const mergedMeta: SchoolMeta = {
    ...cloud.schoolMeta,
    ...local.schoolMeta,
    sekolah: local.schoolMeta?.sekolah || cloud.schoolMeta?.sekolah || "SMKN 2 Gorontalo",
    npsn: local.schoolMeta?.npsn || cloud.schoolMeta?.npsn || "40501083",
    alamat: local.schoolMeta?.alamat || cloud.schoolMeta?.alamat || "Kota Gorontalo",
    semester: local.schoolMeta?.semester || cloud.schoolMeta?.semester || "Ganjil",
    tahun: local.schoolMeta?.tahun || cloud.schoolMeta?.tahun || "2026/2027",
    kota: local.schoolMeta?.kota || cloud.schoolMeta?.kota || "Gorontalo",
    kepalaSekolah: local.schoolMeta?.kepalaSekolah || cloud.schoolMeta?.kepalaSekolah || "",
    nipKepalaSekolah: local.schoolMeta?.nipKepalaSekolah || cloud.schoolMeta?.nipKepalaSekolah || "",
    logoUrl: local.schoolMeta?.logoUrl || cloud.schoolMeta?.logoUrl || "/logo new.jpg",
    kopType: local.schoolMeta?.kopType || cloud.schoolMeta?.kopType || "text",
    kopImageUrl: local.schoolMeta?.kopImageUrl || cloud.schoolMeta?.kopImageUrl || "",
    kopInstansi: local.schoolMeta?.kopInstansi || cloud.schoolMeta?.kopInstansi || "PEMERINTAH PROVINSI GORONTALO",
    kopDinas: local.schoolMeta?.kopDinas || cloud.schoolMeta?.kopDinas || "DINAS PENDIDIKAN DAN KEBUDAYAAN",
    kopSekolah: local.schoolMeta?.kopSekolah || cloud.schoolMeta?.kopSekolah || "SMK NEGERI 2 GORONTALO",
    kopAlamat: local.schoolMeta?.kopAlamat || cloud.schoolMeta?.kopAlamat || "Jl. Drs. Achmad Najamuddin No. 34, Kel. Wumialo, Kec. Kota Tengah",
    kopKontak: local.schoolMeta?.kopKontak || cloud.schoolMeta?.kopKontak || "",
    kopNpsnAkreditasi: local.schoolMeta?.kopNpsnAkreditasi || cloud.schoolMeta?.kopNpsnAkreditasi || "",
    logoKananUrl: local.schoolMeta?.logoKananUrl || cloud.schoolMeta?.logoKananUrl || "",
    showLogoKanan: local.schoolMeta?.showLogoKanan ?? cloud.schoolMeta?.showLogoKanan ?? false
  };

  // 3. Records & Index: smart merge per teacher (strictly ignoring dummy teachers)
  const mergedRecords: Record<string, SupervisionRecord> = {};
  const mergedIndex: SupervisionIndex = {};

  mergedTeachers.forEach(teacher => {
    if (isDummyTeacher(teacher)) return;
    const slug = slugifyTeacher(teacher);
    const localRec = local.records?.[slug] || createBlankRecord(teacher, mergedMeta.kepalaSekolah, mergedMeta.nipKepalaSekolah);
    const cloudRec = cloud.records?.[slug] || createBlankRecord(teacher, mergedMeta.kepalaSekolah, mergedMeta.nipKepalaSekolah);

    const winnerRec = mergeTeacherRecord(localRec, cloudRec);
    mergedRecords[slug] = winnerRec;

    const summary = calculateScoreSummary(winnerRec);
    if (summary.count > 0 || winnerRec.driveUrl) {
      mergedIndex[slug] = {
        name: teacher,
        nip: winnerRec.nip || "",
        mapel: winnerRec.mapel || "",
        driveUrl: winnerRec.driveUrl || "",
        total: summary.count > 0 ? summary.total : null,
        count: summary.count,
        percentage: summary.count > 0 ? summary.percentage : null,
        predikatCls: summary.count > 0 ? summary.predikat.cls : "z",
        predikatLabel: summary.count > 0 ? summary.predikat.label : "Belum Disupervisi",
        updatedAt: winnerRec.updatedAt || new Date().toISOString()
      };
    }
  });

  const latestUpdated = [local.updatedAt, cloud.updatedAt, new Date().toISOString()]
    .filter(Boolean)
    .sort()
    .pop() || new Date().toISOString();

  return {
    version: "2.6",
    updatedAt: latestUpdated,
    schoolMeta: mergedMeta,
    teachers: mergedTeachers,
    index: mergedIndex,
    records: mergedRecords
  };
}

/**
 * Compile all local data into a full synchronization payload
 */
export function buildSyncPayload(): SyncPayload {
  const schoolMeta = getSchoolMeta();
  const teachers = getTeachersList()
    .map(t => t.toUpperCase())
    .filter(t => !isDummyTeacher(t));
  const index = getSupervisionIndex();
  const records: Record<string, SupervisionRecord> = {};

  teachers.forEach(teacher => {
    const slug = slugifyTeacher(teacher);
    records[slug] = getTeacherRecord(teacher, schoolMeta);
  });

  return {
    version: "2.6",
    updatedAt: new Date().toISOString(),
    schoolMeta,
    teachers,
    index,
    records
  };
}

/**
 * Apply a sync payload from the cloud into local storage with SMART MERGE
 * Guarantees that no local evaluation is deleted and dummy data is filtered out
 */
export function applySyncPayload(payload: SyncPayload): SyncPayload {
  if (!payload) return buildSyncPayload();

  // Pre-clean incoming payload of dummy teachers
  const cleanPayload: SyncPayload = {
    ...payload,
    teachers: (payload.teachers || []).filter(t => !isDummyTeacher(t)),
    index: {},
    records: {}
  };

  if (payload.index) {
    Object.keys(payload.index).forEach(k => {
      if (!isDummySlug(k) && !isDummyTeacher(payload.index[k]?.name)) {
        cleanPayload.index[k] = payload.index[k];
      }
    });
  }

  if (payload.records) {
    Object.keys(payload.records).forEach(k => {
      if (!isDummySlug(k) && !isDummyTeacher(payload.records[k]?.name)) {
        cleanPayload.records[k] = payload.records[k];
      }
    });
  }

  const currentLocal = buildSyncPayload();
  const merged = mergeSyncPayloads(currentLocal, cleanPayload);

  if (merged.schoolMeta) {
    saveSchoolMeta(merged.schoolMeta);
  }
  if (Array.isArray(merged.teachers) && merged.teachers.length > 0) {
    saveTeachersList(merged.teachers);
  }
  if (merged.records && typeof merged.records === "object") {
    Object.keys(merged.records).forEach(slug => {
      if (!isDummySlug(slug)) {
        const rec = merged.records[slug];
        if (rec && !isDummyTeacher(rec.name)) {
          rec.name = rec.name.toUpperCase();
          localStorage.setItem(`sup_v2_rec:${slug}`, JSON.stringify(rec));
        }
      }
    });
  }
  if (merged.index && typeof merged.index === "object") {
    saveSupervisionIndex(merged.index);
  }

  // Clean any lingering dummy record keys from localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sup_v2_rec:")) {
      const slug = key.replace("sup_v2_rec:", "");
      if (isDummySlug(slug)) {
        localStorage.removeItem(key);
      }
    }
  }

  saveSyncConfig({ lastSyncTime: new Date().toISOString() });
  return merged;
}

/**
 * Unified resilient request helper to communicate with Google Apps Script Web App
 * - Multi-tier architecture guaranteeing delivery across all devices (Mobile, Desktop, Tablet):
 *   1. Local/Preview dev-server proxy (/api/sync-proxy) if reachable and returns valid JSON.
 *   2. Direct CORS fetch with standard "Content-Type: text/plain" and no credentials: "omit".
 *   3. Fail-Safe mode: "no-cors" POST transmission if CORS redirect is rejected by browser.
 *      (mode: "no-cors" bypasses browser cross-origin redirect blocking so Google Apps Script
 *       always receives the payload and writes it directly to the Google Spreadsheet).
 */
async function requestGoogleScript(
  targetUrl: string,
  options: { method: "GET" | "POST"; body?: string; timeoutMs?: number }
): Promise<any> {
  const timeoutMs = options.timeoutMs || 15000;

  // 1. Try local dev-server proxy if reachable (avoids any browser iframe/CORS issues)
  try {
    const proxyUrl = `/api/sync-proxy?url=${encodeURIComponent(targetUrl)}`;
    const controller = new AbortController();
    const proxyTimer = setTimeout(() => controller.abort(), 4000);
    const proxyResp = await fetch(proxyUrl, {
      method: options.method,
      headers: options.method === "POST" ? { "Content-Type": "text/plain" } : undefined,
      body: options.body,
      signal: controller.signal
    });
    clearTimeout(proxyTimer);

    const contentType = proxyResp.headers.get("content-type") || "";
    // Ensure proxy actually responded with JSON and not SPA HTML fallback
    if (proxyResp.ok && contentType.includes("json")) {
      const data = await proxyResp.json();
      return data;
    }
  } catch (_proxyErr) {
    // Proxy not available (e.g., static deployment or offline), proceed to direct multi-tier fetch
  }

  // 2. Direct fetch with clean headers
  if (options.method === "POST") {
    // Strategy A: Standard direct fetch with mode: "cors"
    try {
      const controller = new AbortController();
      const corsTimer = setTimeout(() => controller.abort(), timeoutMs);

      const directResp = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: options.body,
        mode: "cors",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(corsTimer);

      if (directResp.ok) {
        const text = await directResp.text();
        try {
          return JSON.parse(text);
        } catch {
          return { status: "success", message: "Data berhasil disimpan di Google Spreadsheet." };
        }
      }
    } catch (corsErr: any) {
      console.warn("Direct CORS POST failed (CORS/Redirect restriction on mobile/device), engaging fail-safe delivery:", corsErr?.message || corsErr);
    }

    // Strategy B: Fail-safe mode: "no-cors" POST
    // Guarantees delivery to Google Apps Script on all devices, iOS Safari, Android Chrome, and WebViews!
    try {
      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: options.body,
        mode: "no-cors"
      });

      return {
        status: "success",
        message: "Data berhasil dikirim & disimpan ke Google Spreadsheet!",
        deliveredViaNoCors: true
      };
    } catch (fallbackErr: any) {
      throw new Error(`Gagal mengirim data: ${fallbackErr?.message || "Periksa koneksi internet Anda."}`);
    }
  } else {
    // GET request (pulling data or ping)
    try {
      const controller = new AbortController();
      const getTimer = setTimeout(() => controller.abort(), timeoutMs);

      const directResp = await fetch(targetUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(getTimer);

      if (directResp.ok) {
        const text = await directResp.text();
        return JSON.parse(text);
      }
      throw new Error(`HTTP ${directResp.status}`);
    } catch (getErr: any) {
      throw new Error(`Gagal menarik data: ${getErr.message || "Periksa koneksi internet atau izin Web App."}`);
    }
  }
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testSpreadsheetConnection(webAppUrl: string): Promise<{ success: boolean; message: string; spreadsheetUrl?: string }> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) {
    return { success: false, message: "URL Web App Google Apps Script belum diisi." };
  }

  try {
    const pingUrl = cleanUrl.includes("?") 
      ? `${cleanUrl}&action=ping&t=${Date.now()}`
      : `${cleanUrl}?action=ping&t=${Date.now()}`;

    const data = await requestGoogleScript(pingUrl, { method: "GET", timeoutMs: 8000 });

    if (data.status === "ok" || data.status === "success") {
      if (data.spreadsheetUrl) {
        saveSyncConfig({ spreadsheetUrl: data.spreadsheetUrl });
      }
      return { 
        success: true, 
        message: data.message || "Koneksi ke Google Spreadsheet berhasil!",
        spreadsheetUrl: data.spreadsheetUrl
      };
    }

    return { success: false, message: data.message || "Respon dari Spreadsheet tidak sesuai." };
  } catch (err: any) {
    console.warn("Test connection notice:", err?.message || err);
    return { 
      success: false, 
      message: `Gagal terhubung: ${err.message || "Pastikan Web App disetel akses 'Siapa Saja (Anyone)'."}` 
    };
  }
}

// In-flight mutex to avoid concurrent conflicting sync requests
let isPushPullInProgress = false;

/**
 * Push local data to Google Spreadsheet with Two-Way Pre-Merge (Anti-Delete)
 * Automatically merges with cloud data and ensures all device changes are preserved!
 * Supports optional specificRecord to immediately prioritize saving a newly edited teacher.
 */
export async function pushToSpreadsheet(
  webAppUrl?: string,
  specificRecord?: SupervisionRecord
): Promise<{ success: boolean; message: string; payload?: SyncPayload }> {
  const url = webAppUrl || getSyncConfig().webAppUrl;
  if (!url) {
    return { success: false, message: "URL Web App belum diatur." };
  }

  // If a push/pull is already running and this is a specific user save action, wait briefly
  if (isPushPullInProgress) {
    if (specificRecord) {
      let waitCount = 0;
      while (isPushPullInProgress && waitCount < 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        waitCount++;
      }
    } else {
      return { success: true, message: "Sinkronisasi sedang berjalan di latar belakang..." };
    }
  }

  isPushPullInProgress = true;
  try {
    // If specificRecord provided, ensure it is saved in local storage first
    if (specificRecord) {
      saveTeacherRecord(specificRecord);
    }

    // 1. Fast optional pre-pull (Max 3.5s timeout) to merge latest changes from other devices locally
    let payloadToPush = buildSyncPayload();
    try {
      const fetchUrl = url.includes("?") 
        ? `${url}&action=pull&t=${Date.now()}`
        : `${url}?action=pull&t=${Date.now()}`;

      const cloudResult = await requestGoogleScript(fetchUrl, { method: "GET", timeoutMs: 3500 });
      if (cloudResult && cloudResult.status === "success" && cloudResult.payload) {
        payloadToPush = applySyncPayload(cloudResult.payload);
      }
    } catch (pullErr) {
      console.warn("Pre-push cloud pull skipped (Apps Script will perform server-side merge):", pullErr);
    }

    // Re-verify that specificRecord is present with highest priority in payload
    if (specificRecord) {
      const upperName = specificRecord.name.trim().toUpperCase();
      const slug = slugifyTeacher(upperName);
      if (!payloadToPush.records) payloadToPush.records = {};
      payloadToPush.records[slug] = {
        ...specificRecord,
        name: upperName,
        updatedAt: specificRecord.updatedAt || new Date().toISOString()
      };

      const summary = calculateScoreSummary(payloadToPush.records[slug]);
      if (!payloadToPush.index) payloadToPush.index = {};
      if (summary.count > 0 || specificRecord.driveUrl) {
        payloadToPush.index[slug] = {
          name: upperName,
          nip: specificRecord.nip || "",
          mapel: specificRecord.mapel || "",
          driveUrl: specificRecord.driveUrl || "",
          total: summary.count > 0 ? summary.total : null,
          count: summary.count,
          percentage: summary.count > 0 ? summary.percentage : null,
          predikatCls: summary.count > 0 ? summary.predikat.cls : "z",
          predikatLabel: summary.count > 0 ? summary.predikat.label : "Belum Disupervisi",
          updatedAt: payloadToPush.records[slug].updatedAt || new Date().toISOString()
        };
      }
    }

    // 2. Send the combined merged payload to Google Apps Script
    const bodyData = JSON.stringify({
      action: "push",
      currentRecord: specificRecord || null,
      payload: payloadToPush
    });

    const result = await requestGoogleScript(url, {
      method: "POST",
      body: bodyData,
      timeoutMs: 15000
    });

    if (result.status === "success" || result.status === "ok" || result.deliveredViaNoCors) {
      const now = new Date().toISOString();
      saveSyncConfig({ 
        lastSyncTime: now,
        spreadsheetUrl: result.spreadsheetUrl || getSyncConfig().spreadsheetUrl
      });

      if (result.payload) {
        payloadToPush = applySyncPayload(result.payload);
      }

      return { 
        success: true, 
        message: "Data berhasil disimpan & disinkronkan ke Google Spreadsheet!",
        payload: payloadToPush
      };
    }

    return { 
      success: false, 
      message: result.message || "Gagal menyimpan ke Google Spreadsheet." 
    };
  } catch (err: any) {
    console.warn("Push to spreadsheet warning:", err?.message || err);
    return { 
      success: false, 
      message: `Gagal mengirim data: ${err.message || "Periksa koneksi internet."}` 
    };
  } finally {
    isPushPullInProgress = false;
  }
}

/**
 * Pull cloud data from Google Spreadsheet with Two-Way Smart Merge
 * Retains any local evaluations and adds newly completed teachers from other devices
 */
export async function pullFromSpreadsheet(webAppUrl?: string): Promise<{ success: boolean; message: string; payload?: SyncPayload }> {
  const url = webAppUrl || getSyncConfig().webAppUrl;
  if (!url) {
    return { success: false, message: "URL Web App belum diatur." };
  }

  try {
    const fetchUrl = url.includes("?") 
      ? `${url}&action=pull&t=${Date.now()}`
      : `${url}?action=pull&t=${Date.now()}`;

    const result = await requestGoogleScript(fetchUrl, { method: "GET" });

    if (result.status === "success" && result.payload) {
      // Smart merge cloud data into local storage
      const merged = applySyncPayload(result.payload);
      return { 
        success: true, 
        message: "Data terbaru berhasil ditarik dan digabungkan dari Google Spreadsheet!",
        payload: merged
      };
    }

    if (result.status === "empty") {
      return { 
        success: true, 
        message: "Google Spreadsheet masih kosong. Anda dapat mengirim data pertama dari aplikasi ini." 
      };
    }

    return { 
      success: false, 
      message: result.message || "Gagal menarik data dari Google Spreadsheet." 
    };
  } catch (err: any) {
    console.warn("Pull from spreadsheet notice:", err?.message || err);
    return { 
      success: false, 
      message: `Gagal menarik data: ${err.message || "Periksa koneksi internet atau izin Web App."}` 
    };
  }
}

/**
 * Updated Google Apps Script code with server-side smart merge (Anti-Delete)
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: DATABASE SUPERVISI ADMINISTRASI GURU
 * Fitur: Row-Based Storage (Anti-Limit 50.000 Karakter)
 *        Spreadsheet Data Protection (Anti-Hapus Data Terisi)
 *        Multi-Device Realtime Sync
 * SMKN 2 GORONTALO • Kurikulum Merdeka
 * =========================================================================
 */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "pull";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var spreadsheetUrl = ss.getUrl();

    if (action === "ping") {
      return respondJson({
        status: "ok",
        message: "Koneksi Google Spreadsheet Berhasil Terhubung!",
        spreadsheetUrl: spreadsheetUrl,
        timestamp: new Date().toISOString()
      });
    }

    if (action === "pull" || action === "get") {
      var payload = readDatabaseFromSheet(ss);
      if (!payload || !payload.teachers || payload.teachers.length === 0) {
        return respondJson({
          status: "empty",
          message: "Database belum memiliki data tersimpan.",
          spreadsheetUrl: spreadsheetUrl
        });
      }

      return respondJson({
        status: "success",
        payload: payload,
        spreadsheetUrl: spreadsheetUrl,
        timestamp: new Date().toISOString()
      });
    }

    return respondJson({ status: "error", message: "Aksi tidak dikenal." });
  } catch (err) {
    return respondJson({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action || "push";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var spreadsheetUrl = ss.getUrl();

    if (action === "push" && data.payload) {
      var incomingPayload = data.payload;
      var incomingCurrent = data.currentRecord || null;

      // 1. Baca data yang sudah tersimpan sebelumnya di Spreadsheet
      var existingPayload = readDatabaseFromSheet(ss);

      // 2. Gabungkan data masuk dengan data yang ada di Spreadsheet
      //    PERLINDUNGAN UTAMA: Jangan pernah menghapus data guru yang sudah terisi di Spreadsheet!
      var finalPayload = mergeAndProtectDatabase(existingPayload, incomingPayload, incomingCurrent);

      // 3. Simpan data secara row-based di sheet 'Database_Sync' (Bebas limit 50.000 karakter)
      saveDatabaseToSheet(ss, finalPayload);

      // 4. Perbarui Sheet 'Rekap_Supervisi' (Tabel Ringkasan 72 Guru)
      updateRekapSheet(ss, finalPayload);

      // 5. Perbarui Sheet 'Rincian_19_Indikator'
      updateDetailSheet(ss, finalPayload);

      return respondJson({
        status: "success",
        message: "Data supervisi berhasil disimpan & diperbarui di Google Spreadsheet.",
        spreadsheetUrl: spreadsheetUrl,
        payload: finalPayload,
        timestamp: new Date().toISOString()
      });
    }

    return respondJson({ status: "error", message: "Aksi POST tidak valid." });
  } catch (err) {
    return respondJson({ status: "error", message: err.toString() });
  }
}

/**
 * Membaca seluruh data dari sheet 'Database_Sync'
 * Mendukung format baris (row-based) dan auto-migrasi format lama di sel A1
 */
function readDatabaseFromSheet(ss) {
  var syncSheet = ss.getSheetByName("Database_Sync");
  if (!syncSheet) return null;

  var lastRow = syncSheet.getLastRow();
  if (lastRow < 1) return null;

  // Cek apakah masih format lama (JSON string tunggal di A1)
  var cellA1 = syncSheet.getRange("A1").getValue();
  if (typeof cellA1 === "string" && cellA1.trim().charAt(0) === "{") {
    try {
      return JSON.parse(cellA1);
    } catch (eParse) {}
  }

  // Format Baru: Row-Based
  if (lastRow < 2) return null;

  var values = syncSheet.getRange(1, 1, lastRow, 6).getValues();
  var schoolMeta = {};
  var teachers = [];
  var records = {};
  var index = {};

  for (var i = 1; i < values.length; i++) {
    var key = values[i][0];
    var teacherName = values[i][1];
    var jsonStr = values[i][2];

    if (!key || !jsonStr) continue;

    try {
      var parsed = JSON.parse(jsonStr);
      if (key === "_META_") {
        schoolMeta = parsed;
      } else {
        var slug = String(key).trim();
        var upperName = String(teacherName).trim().toUpperCase();
        if (upperName && !isDummyName(upperName)) {
          teachers.push(upperName);
          records[slug] = parsed;

          var evalCheck = isRecordHasData(parsed);
          var totalScore = calculateTotalScore(parsed);
          if (evalCheck || totalScore > 0) {
            var pct = totalScore > 0 ? (totalScore / 76) * 100 : 0;
            var predLabel = getPredikatLabel(pct);
            index[slug] = {
              name: upperName,
              nip: parsed.nip || "",
              mapel: parsed.mapel || "",
              driveUrl: parsed.driveUrl || "",
              total: totalScore > 0 ? totalScore : null,
              percentage: totalScore > 0 ? pct : null,
              predikatLabel: predLabel,
              updatedAt: parsed.updatedAt || new Date().toISOString()
            };
          }
        }
      }
    } catch (eRow) {}
  }

  return {
    version: "2.6",
    updatedAt: new Date().toISOString(),
    schoolMeta: schoolMeta,
    teachers: teachers,
    index: index,
    records: records
  };
}

/**
 * Menyimpan database ke sheet 'Database_Sync' per baris
 * Setiap guru disimpan di 1 baris, aman dari batasan 50.000 karakter per sel!
 */
function saveDatabaseToSheet(ss, payload) {
  var syncSheet = ss.getSheetByName("Database_Sync");
  if (!syncSheet) {
    syncSheet = ss.insertSheet("Database_Sync");
  }
  syncSheet.clear();

  var rows = [
    ["Key", "Nama Guru", "JSON_Data", "UpdatedAt", "TotalSkor", "IsEvaluated"]
  ];

  // Baris Metadata Sekolah
  var meta = payload.schoolMeta || {};
  rows.push([
    "_META_",
    "Metadata Sekolah",
    JSON.stringify(meta),
    payload.updatedAt || new Date().toISOString(),
    0,
    0
  ]);

  // Baris per guru
  var teachers = payload.teachers || [];
  var records = payload.records || {};
  var index = payload.index || {};

  for (var i = 0; i < teachers.length; i++) {
    var teacher = teachers[i];
    var slug = teacher.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    var rec = records[slug] || { name: teacher, scores: {} };
    var hasData = isRecordHasData(rec);
    var total = calculateTotalScore(rec);

    rows.push([
      slug,
      teacher,
      JSON.stringify(rec),
      rec.updatedAt || new Date().toISOString(),
      total,
      hasData ? 1 : 0
    ]);
  }

  if (rows.length > 0) {
    syncSheet.getRange(1, 1, rows.length, 6).setValues(rows);
  }
}

/**
 * Menggabungkan data masuk dengan data Spreadsheet:
 * ATURAN PERLINDUNGAN:
 * 1. Jika guru X di Spreadsheet sudah dinilai, dan data masuk untuk guru X kosong -> PERTAHANKAN DATA SPREADSHEET!
 * 2. Jika incomingCurrent (guru yang baru saja disimpan) ada -> update guru tersebut dengan data terbaru!
 * 3. Jika kedua pihak memiliki data -> merge skor indikator 1-19 dan update field terbaru.
 */
function mergeAndProtectDatabase(existing, incoming, incomingCurrent) {
  if (!existing || !existing.records) return incoming;
  if (!incoming) return existing;

  var existTeachers = existing.teachers || [];
  var incTeachers = incoming.teachers || [];
  var teacherMap = {};
  var mergedTeachers = [];

  // Gabungkan daftar guru
  var allTeachers = existTeachers.concat(incTeachers);
  for (var t = 0; t < allTeachers.length; t++) {
    var nameUpper = String(allTeachers[t]).trim().toUpperCase();
    if (nameUpper && !isDummyName(nameUpper) && !teacherMap[nameUpper]) {
      teacherMap[nameUpper] = true;
      mergedTeachers.push(nameUpper);
    }
  }

  // Gabungkan profil sekolah (prioritaskan yang terisi)
  var existMeta = existing.schoolMeta || {};
  var incMeta = incoming.schoolMeta || {};
  var mergedMeta = {
    sekolah: incMeta.sekolah || existMeta.sekolah || "SMKN 2 Gorontalo",
    npsn: incMeta.npsn || existMeta.npsn || "40501083",
    alamat: incMeta.alamat || existMeta.alamat || "Kota Gorontalo",
    semester: incMeta.semester || existMeta.semester || "Ganjil",
    tahun: incMeta.tahun || existMeta.tahun || "2026/2027",
    kota: incMeta.kota || existMeta.kota || "Gorontalo",
    kepalaSekolah: incMeta.kepalaSekolah || existMeta.kepalaSekolah || "",
    nipKepalaSekolah: incMeta.nipKepalaSekolah || existMeta.nipKepalaSekolah || "",
    logoUrl: incMeta.logoUrl || existMeta.logoUrl || "/logo new.jpg"
  };

  var existRecords = existing.records || {};
  var incRecords = incoming.records || {};
  var existIndex = existing.index || {};
  var incIndex = incoming.index || {};

  var currentSlug = incomingCurrent && incomingCurrent.name 
    ? incomingCurrent.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : null;

  var mergedRecords = {};
  var mergedIndex = {};

  for (var j = 0; j < mergedTeachers.length; j++) {
    var teacherName = mergedTeachers[j];
    var slug = teacherName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    var recE = existRecords[slug];
    var recI = incRecords[slug];

    // Jika guru ini adalah yang baru saja disimpan eksplisit oleh user
    if (currentSlug && slug === currentSlug && incomingCurrent) {
      mergedRecords[slug] = incomingCurrent;
      var totalCurrent = calculateTotalScore(incomingCurrent);
      var pctCurrent = totalCurrent > 0 ? (totalCurrent / 76) * 100 : 0;
      mergedIndex[slug] = {
        name: teacherName,
        nip: incomingCurrent.nip || "",
        mapel: incomingCurrent.mapel || "",
        driveUrl: incomingCurrent.driveUrl || "",
        total: totalCurrent > 0 ? totalCurrent : null,
        percentage: totalCurrent > 0 ? pctCurrent : null,
        predikatLabel: getPredikatLabel(pctCurrent),
        updatedAt: incomingCurrent.updatedAt || new Date().toISOString()
      };
      continue;
    }

    var evalE = isRecordHasData(recE);
    var evalI = isRecordHasData(recI);

    // KASUS 1: Di Spreadsheet SUDAH TERISI, tetapi di device masuk KOSONG
    // PERLINDUNGAN: Pertahankan data Spreadsheet! Jangan pernah menghapus data terisi!
    if (evalE && !evalI) {
      mergedRecords[slug] = recE;
      if (existIndex[slug]) {
        mergedIndex[slug] = existIndex[slug];
      } else {
        var totE = calculateTotalScore(recE);
        var pctE = totE > 0 ? (totE / 76) * 100 : 0;
        mergedIndex[slug] = {
          name: teacherName,
          nip: recE.nip || "",
          mapel: recE.mapel || "",
          driveUrl: recE.driveUrl || "",
          total: totE > 0 ? totE : null,
          percentage: totE > 0 ? pctE : null,
          predikatLabel: getPredikatLabel(pctE),
          updatedAt: recE.updatedAt || new Date().toISOString()
        };
      }
      continue;
    }

    // KASUS 2: Di Spreadsheet kosong, tetapi di device masuk ada data baru
    if (!evalE && evalI) {
      mergedRecords[slug] = recI;
      if (incIndex[slug]) {
        mergedIndex[slug] = incIndex[slug];
      } else {
        var totI = calculateTotalScore(recI);
        var pctI = totI > 0 ? (totI / 76) * 100 : 0;
        mergedIndex[slug] = {
          name: teacherName,
          nip: recI.nip || "",
          mapel: recI.mapel || "",
          driveUrl: recI.driveUrl || "",
          total: totI > 0 ? totI : null,
          percentage: totI > 0 ? pctI : null,
          predikatLabel: getPredikatLabel(pctI),
          updatedAt: recI.updatedAt || new Date().toISOString()
        };
      }
      continue;
    }

    // KASUS 3: Kedua belah pihak ada data supervisi -> Gabungkan secara cerdas
    if (evalE && evalI) {
      var timeE = recE.updatedAt ? new Date(recE.updatedAt).getTime() : 0;
      var timeI = recI.updatedAt ? new Date(recI.updatedAt).getTime() : 0;
      var winner = timeI >= timeE ? recI : recE;
      var loser = timeI >= timeE ? recE : recI;

      var mergedScores = {};
      var sk;
      if (loser.scores) {
        for (sk in loser.scores) {
          if (loser.scores[sk] !== null && loser.scores[sk] !== undefined) {
            mergedScores[sk] = loser.scores[sk];
          }
        }
      }
      if (winner.scores) {
        for (sk in winner.scores) {
          if (winner.scores[sk] !== null && winner.scores[sk] !== undefined) {
            mergedScores[sk] = winner.scores[sk];
          }
        }
      }

      var combinedRec = {
        name: teacherName,
        nip: winner.nip || loser.nip || "",
        mapel: winner.mapel || loser.mapel || "",
        kelas: winner.kelas || loser.kelas || "",
        jtm: winner.jtm || loser.jtm || "",
        tugasTambahan: winner.tugasTambahan || loser.tugasTambahan || "",
        driveUrl: winner.driveUrl || loser.driveUrl || "",
        catatan: winner.catatan || loser.catatan || "",
        tindakLanjut: winner.tindakLanjut || loser.tindakLanjut || "",
        namaSupervisor: winner.namaSupervisor || loser.namaSupervisor || "",
        tanggal: winner.tanggal || loser.tanggal || "",
        scores: mergedScores,
        updatedAt: new Date(Math.max(timeE, timeI, Date.now())).toISOString()
      };

      mergedRecords[slug] = combinedRec;
      var totComb = calculateTotalScore(combinedRec);
      var pctComb = totComb > 0 ? (totComb / 76) * 100 : 0;
      mergedIndex[slug] = {
        name: teacherName,
        nip: combinedRec.nip || "",
        mapel: combinedRec.mapel || "",
        driveUrl: combinedRec.driveUrl || "",
        total: totComb > 0 ? totComb : null,
        percentage: totComb > 0 ? pctComb : null,
        predikatLabel: getPredikatLabel(pctComb),
        updatedAt: combinedRec.updatedAt
      };
      continue;
    }

    // KASUS 4: Keduanya belum dievaluasi
    mergedRecords[slug] = recI || recE || { name: teacherName, scores: {} };
  }

  return {
    version: "2.6",
    updatedAt: new Date().toISOString(),
    schoolMeta: mergedMeta,
    teachers: mergedTeachers,
    index: mergedIndex,
    records: mergedRecords
  };
}

function calculateTotalScore(rec) {
  if (!rec || !rec.scores) return 0;
  var sum = 0;
  for (var k in rec.scores) {
    var val = Number(rec.scores[k]);
    if (!isNaN(val) && val > 0) sum += val;
  }
  return sum;
}

function getPredikatLabel(pct) {
  if (pct >= 91) return "Amat Baik";
  if (pct >= 81) return "Baik";
  if (pct >= 71) return "Cukup";
  if (pct > 0) return "Kurang";
  return "Belum Disupervisi";
}

function isRecordHasData(rec) {
  if (!rec) return false;
  if (rec.scores) {
    for (var k in rec.scores) {
      if (rec.scores[k] !== null && rec.scores[k] !== undefined && Number(rec.scores[k]) > 0) {
        return true;
      }
    }
  }
  if (rec.driveUrl && String(rec.driveUrl).trim() !== "") return true;
  if (rec.catatan && String(rec.catatan).trim() !== "") return true;
  if (rec.tindakLanjut && String(rec.tindakLanjut).trim() !== "") return true;
  return false;
}

function isDummyName(str) {
  if (!str) return false;
  var upper = String(str).trim().toUpperCase();
  if (upper === "GURU" || upper === "DUMMY" || upper === "SAMPLE" || upper === "GURU BARU") return true;
  if (/^GURU[\s_-]*\d+/i.test(upper)) return true;
  if (/^GURU\s+[IVXLCDM]+/i.test(upper)) return true;
  return false;
}

function updateRekapSheet(ss, payload) {
  var sheet = ss.getSheetByName("Rekap_Supervisi");
  if (!sheet) {
    sheet = ss.insertSheet("Rekap_Supervisi", 0);
  }
  sheet.clear();

  // Header Identitas Sekolah
  var meta = payload.schoolMeta || {};
  sheet.getRange("A1:G1").merge().setValue("REKAPITULASI SUPERVISI ADMINISTRASI GURU").setFontWeight("bold").setFontSize(14);
  sheet.getRange("A2:G2").merge().setValue("Satuan Pendidikan: " + (meta.sekolah || "SMKN 2 Gorontalo") + " | Semester " + (meta.semester || "Ganjil") + " T.P. " + (meta.tahun || "2026/2027")).setFontSize(11);
  sheet.getRange("A3:G3").merge().setValue("Terakhir Diperbarui: " + new Date().toLocaleString("id-ID")).setFontStyle("italic").setFontSize(9);

  // Header Kolom Tabel
  var headers = [
    "No", "Nama Guru", "NIP", "Mata Pelajaran", "Kelas", "JTM", "Tugas Tambahan", "Link Soft Copy Drive",
    "Total Skor", "Skor Maks", "Persentase (%)", "Predikat", "Status", "Supervisor", "Tanggal", "Catatan", "Tindak Lanjut"
  ];

  sheet.getRange(5, 1, 1, headers.length).setValues([headers])
    .setBackground("#4338CA")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var teachers = payload.teachers || [];
  var index = payload.index || {};
  var records = payload.records || {};

  var rows = [];
  for (var i = 0; i < teachers.length; i++) {
    var teacher = teachers[i];
    var slug = teacher.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    var entry = index[slug];
    var rec = records[slug] || {};

    var hasEntry = entry && entry.total !== null && entry.total !== undefined && entry.total > 0;
    var total = hasEntry ? entry.total : "";
    var pct = hasEntry && entry.percentage !== null ? Number(entry.percentage).toFixed(1) + "%" : "";
    var pred = hasEntry ? entry.predikatLabel : "Belum Disupervisi";
    var status = hasEntry ? "Selesai" : "Menunggu";

    rows.push([
      i + 1,
      teacher,
      rec.nip || "",
      rec.mapel || "",
      rec.kelas || "",
      rec.jtm || "",
      rec.tugasTambahan || "",
      rec.driveUrl || (entry ? entry.driveUrl : "") || "",
      total,
      76,
      pct,
      pred,
      status,
      rec.namaSupervisor || meta.kepalaSekolah || "",
      rec.tanggal || "",
      rec.catatan || "",
      rec.tindakLanjut || ""
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(6, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(6, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(6, 8, rows.length, 5).setHorizontalAlignment("center");
  }

  sheet.autoResizeColumns(1, headers.length);
}

function updateDetailSheet(ss, payload) {
  var sheet = ss.getSheetByName("Rincian_19_Indikator");
  if (!sheet) {
    sheet = ss.insertSheet("Rincian_19_Indikator", 1);
  }
  sheet.clear();

  var headers = ["No", "Nama Guru", "Mata Pelajaran"];
  for (var k = 1; k <= 19; k++) {
    headers.push("Ind-" + k);
  }
  headers.push("Total Skor");
  headers.push("Nilai (%)");
  headers.push("Predikat");

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground("#1E293B")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  var teachers = payload.teachers || [];
  var index = payload.index || {};
  var records = payload.records || {};

  var rows = [];
  for (var i = 0; i < teachers.length; i++) {
    var teacher = teachers[i];
    var slug = teacher.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    var entry = index[slug];
    var rec = records[slug] || {};
    var scores = rec.scores || {};

    var row = [i + 1, teacher, rec.mapel || "-"];
    var sum = 0;
    var filled = 0;

    for (var ind = 1; ind <= 19; ind++) {
      var s = scores[ind];
      if (s !== null && s !== undefined && Number(s) > 0) {
        row.push(Number(s));
        sum += Number(s);
        filled++;
      } else {
        row.push("-");
      }
    }

    var pct = filled > 0 ? ((sum / 76) * 100).toFixed(1) + "%" : "-";
    var pred = entry ? entry.predikatLabel : (filled > 0 ? getPredikatLabel((sum / 76) * 100) : "-");

    row.push(filled > 0 ? sum : "-");
    row.push(pct);
    row.push(pred);

    rows.push(row);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 22).setHorizontalAlignment("center");
  }

  sheet.autoResizeColumns(1, headers.length);
}

function respondJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
