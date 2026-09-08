import { SchoolMeta, SupervisionIndex, SupervisionRecord } from "../types";
import { 
  getSchoolMeta, 
  getTeachersList, 
  getSupervisionIndex, 
  getTeacherRecord,
  saveSchoolMeta,
  saveTeachersList,
  saveSupervisionIndex
} from "./storage";
import { slugifyTeacher } from "../data/supervisionData";

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
 * Compile all local data into a full synchronization payload
 */
export function buildSyncPayload(): SyncPayload {
  const schoolMeta = getSchoolMeta();
  const teachers = getTeachersList().map(t => t.toUpperCase());
  const index = getSupervisionIndex();
  const records: Record<string, SupervisionRecord> = {};

  teachers.forEach(teacher => {
    const slug = slugifyTeacher(teacher);
    records[slug] = getTeacherRecord(teacher, schoolMeta);
  });

  return {
    version: "2.5",
    updatedAt: new Date().toISOString(),
    schoolMeta,
    teachers,
    index,
    records
  };
}

/**
 * Apply a sync payload from the cloud into local storage
 */
export function applySyncPayload(payload: SyncPayload): void {
  if (!payload) return;

  if (payload.schoolMeta) {
    saveSchoolMeta(payload.schoolMeta);
  }
  if (Array.isArray(payload.teachers) && payload.teachers.length > 0) {
    saveTeachersList(payload.teachers.map(t => String(t).trim().toUpperCase()));
  }
  if (payload.records && typeof payload.records === "object") {
    Object.keys(payload.records).forEach(slug => {
      const rec = payload.records[slug];
      if (rec) {
        if (rec.name) {
          rec.name = rec.name.toUpperCase();
        }
        localStorage.setItem(`sup_v2_rec:${slug}`, JSON.stringify(rec));
      }
    });
  }
  if (payload.index && typeof payload.index === "object") {
    const cleanIndex = { ...payload.index };
    Object.keys(cleanIndex).forEach(k => {
      if (cleanIndex[k]?.name) {
        cleanIndex[k].name = cleanIndex[k].name.toUpperCase();
      }
    });
    saveSupervisionIndex(cleanIndex);
  }

  saveSyncConfig({ lastSyncTime: new Date().toISOString() });
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

    const response = await fetch(pingUrl, {
      method: "GET",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
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
    console.error("Test connection failed", err);
    return { 
      success: false, 
      message: `Gagal terhubung: ${err.message || "Pastikan Web App disetel akses 'Siapa Saja (Anyone)'."}` 
    };
  }
}

/**
 * Push local data to Google Spreadsheet
 */
export async function pushToSpreadsheet(webAppUrl?: string): Promise<{ success: boolean; message: string }> {
  const url = webAppUrl || getSyncConfig().webAppUrl;
  if (!url) {
    return { success: false, message: "URL Web App belum diatur." };
  }

  try {
    const payload = buildSyncPayload();
    const bodyData = JSON.stringify({
      action: "push",
      payload
    });

    // We use text/plain to prevent CORS preflight blocking in Google Apps Script
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: bodyData
    });

    const result = await response.json();
    if (result.status === "success" || result.status === "ok") {
      const now = new Date().toISOString();
      saveSyncConfig({ 
        lastSyncTime: now,
        spreadsheetUrl: result.spreadsheetUrl || getSyncConfig().spreadsheetUrl
      });
      return { 
        success: true, 
        message: "Data berhasil dikirim & disinkronkan ke Google Spreadsheet!" 
      };
    }

    return { 
      success: false, 
      message: result.message || "Gagal menyimpan ke Google Spreadsheet." 
    };
  } catch (err: any) {
    console.error("Push to spreadsheet failed", err);
    return { 
      success: false, 
      message: `Gagal mengirim data: ${err.message || "Periksa koneksi internet dan izin Web App."}` 
    };
  }
}

/**
 * Pull cloud data from Google Spreadsheet
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

    const response = await fetch(fetchUrl, {
      method: "GET",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();

    if (result.status === "success" && result.payload) {
      applySyncPayload(result.payload);
      return { 
        success: true, 
        message: "Data terbaru berhasil ditarik dari Google Spreadsheet!",
        payload: result.payload
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
    console.error("Pull from spreadsheet failed", err);
    return { 
      success: false, 
      message: `Gagal menarik data: ${err.message || "Periksa koneksi internet atau izin Web App."}` 
    };
  }
}

/**
 * Ready-to-copy Google Apps Script code for the user
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: DATABASE SUPERVISI ADMINISTRASI GURU
 * Sinkronisasi Multi-Perangkat (HP, Laptop, Tablet, PC)
 * SMKN 2 GORONTALO
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
      var syncSheet = ss.getSheetByName("Database_Sync");
      if (!syncSheet) {
        return respondJson({
          status: "empty",
          message: "Database belum memiliki data tersimpan.",
          spreadsheetUrl: spreadsheetUrl
        });
      }

      var rawJson = syncSheet.getRange("A1").getValue();
      if (!rawJson) {
        return respondJson({
          status: "empty",
          message: "Database kosong.",
          spreadsheetUrl: spreadsheetUrl
        });
      }

      var payload = JSON.parse(rawJson);
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
      var payload = data.payload;

      // 1. Simpan Raw JSON ke Sheet 'Database_Sync'
      var syncSheet = ss.getSheetByName("Database_Sync");
      if (!syncSheet) {
        syncSheet = ss.insertSheet("Database_Sync");
        syncSheet.hideSheet(); // Sembunyikan agar rapi
      }
      syncSheet.getRange("A1").setValue(JSON.stringify(payload));
      syncSheet.getRange("A2").setValue(new Date().toISOString());

      // 2. Buat atau Perbarui Sheet 'Rekap_Supervisi' (Tabel Manusiawi)
      updateRekapSheet(ss, payload);

      // 3. Buat atau Perbarui Sheet 'Rincian_19_Indikator'
      updateDetailSheet(ss, payload);

      return respondJson({
        status: "success",
        message: "Data supervisi berhasil disimpan dan direkapitulasi di Spreadsheet.",
        spreadsheetUrl: spreadsheetUrl,
        timestamp: new Date().toISOString()
      });
    }

    return respondJson({ status: "error", message: "Aksi POST tidak valid." });
  } catch (err) {
    return respondJson({ status: "error", message: err.toString() });
  }
}

function updateRekapSheet(ss, payload) {
  var sheet = ss.getSheetByName("Rekap_Supervisi");
  if (!sheet) {
    sheet = ss.insertSheet("Rekap_Supervisi", 0);
  }
  sheet.clear();

  // Header Sekolah
  var meta = payload.schoolMeta || {};
  sheet.getRange("A1:G1").merge().setValue("REKAPITULASI SUPERVISI ADMINISTRASI GURU").setFontWeight("bold").setFontSize(14);
  sheet.getRange("A2:G2").merge().setValue("Satuan Pendidikan: " + (meta.sekolah || "SMKN 2 Gorontalo") + " | Semester " + (meta.semester || "Ganjil") + " T.P. " + (meta.tahun || "2026/2027")).setFontSize(11);
  sheet.getRange("A3:G3").merge().setValue("Terakhir Diperbarui: " + new Date().toLocaleString("id-ID")).setFontStyle("italic").setFontSize(9);

  // Header Tabel
  var headers = [
    "No", "Nama Guru", "NIP", "Mata Pelajaran", "Kelas", "JTM", "Tugas Tambahan",
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

    var hasEntry = entry && entry.total !== null && entry.total !== undefined;
    var total = hasEntry ? entry.total : "";
    var pct = hasEntry && entry.percentage !== null ? entry.percentage.toFixed(1) + "%" : "";
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
      if (s !== null && s !== undefined) {
        row.push(s);
        sum += s;
        filled++;
      } else {
        row.push("-");
      }
    }

    var pct = filled > 0 ? ((sum / 76) * 100).toFixed(1) + "%" : "-";
    var pred = entry ? entry.predikatLabel : "-";

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
