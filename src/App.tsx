import React, { useState, useEffect } from "react";
import { ActiveTab, SchoolMeta, SupervisionIndex, SupervisionRecord } from "./types";
import { 
  getSchoolMeta, 
  saveSchoolMeta, 
  getTeachersList, 
  saveTeachersList, 
  getSupervisionIndex, 
  getTeacherRecord, 
  saveTeacherRecord, 
  deleteTeacherRecord,
  cleanupLegacyDummyData 
} from "./utils/storage";
import { 
  getSyncConfig, 
  pushToSpreadsheet, 
  pullFromSpreadsheet,
  isRecordEvaluated 
} from "./utils/spreadsheetSync";
import { Header } from "./components/Header";
import { TeacherSidebar } from "./components/InputView/TeacherSidebar";
import { SupervisionForm } from "./components/InputView/SupervisionForm";
import { RekapDashboard } from "./components/RekapView/RekapDashboard";
import { PrintSheet } from "./components/PrintView/PrintSheet";
import { AnalyticsDashboard } from "./components/AnalyticsView/AnalyticsDashboard";
import { BackupModal } from "./components/BackupModal";
import { SpreadsheetSyncModal } from "./components/SpreadsheetSyncModal";
import { AdminAuthModal } from "./components/AdminAuthModal";
import { KopCustomizerModal } from "./components/KopCustomizerModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<string>("");
  const [schoolMeta, setSchoolMeta] = useState<SchoolMeta>(getSchoolMeta());
  const [index, setIndex] = useState<SupervisionIndex>({});
  const [currentRecord, setCurrentRecord] = useState<SupervisionRecord | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isKopCustomizerOpen, setIsKopCustomizerOpen] = useState<boolean>(false);
  const [isSyncConnected, setIsSyncConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    const last = getSyncConfig().lastSyncTime;
    if (!last) return null;
    try {
      return new Date(last).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Admin password modal states for locked buttons
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [pendingAdminTarget, setPendingAdminTarget] = useState<"sync" | "backup" | null>(null);
  const [adminActionTitle, setAdminActionTitle] = useState<string>("Akses Menu Administrator");

  // Core Smart Sync: Pulls or pushes with two-way merging (Anti-Hapus)
  const triggerAutoSync = async (forcePush = false) => {
    const syncConf = getSyncConfig();
    if (!syncConf.webAppUrl || !syncConf.webAppUrl.includes("/exec")) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const res = forcePush 
        ? await pushToSpreadsheet(syncConf.webAppUrl)
        : await pullFromSpreadsheet(syncConf.webAppUrl);

      if (res.success) {
        setIsSyncConnected(true);
        const freshMeta = getSchoolMeta();
        const freshTeachers = getTeachersList();
        const freshIndex = getSupervisionIndex();

        setSchoolMeta(freshMeta);
        setTeachers(freshTeachers);
        setIndex(freshIndex);

        const nowFormatted = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setLastSyncTime(nowFormatted);

        // Update current record ONLY if user is not in the middle of active input
        // Ini mencegah input guru yang sedang diketik tertimpa oleh data sinkronisasi latar belakang
        if (activeTeacher && activeTab !== "input") {
          const freshRecord = getTeacherRecord(activeTeacher, freshMeta);
          setCurrentRecord(freshRecord);
        }
      }
    } catch (err: any) {
      console.warn("Auto-sync notice:", err?.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize application data
  useEffect(() => {
    // Clean up any legacy dummy sample data from prior demo and ensure uppercase teachers
    cleanupLegacyDummyData();

    const loadedMeta = getSchoolMeta();
    const loadedTeachers = getTeachersList();
    const loadedIndex = getSupervisionIndex();

    setSchoolMeta(loadedMeta);
    setTeachers(loadedTeachers);
    setIndex(loadedIndex);

    const firstTeacher = loadedTeachers[0] || "";
    setActiveTeacher(firstTeacher);
    if (firstTeacher) {
      const rec = getTeacherRecord(firstTeacher, loadedMeta);
      setCurrentRecord(rec);
    }

    const syncConf = getSyncConfig();
    const connected = !!syncConf.webAppUrl && syncConf.webAppUrl.includes("/exec");
    setIsSyncConnected(connected);

    // Initial pull on startup to fetch other devices' progress
    if (syncConf.autoSync && syncConf.webAppUrl) {
      pullFromSpreadsheet(syncConf.webAppUrl).then((res) => {
        if (res.success) {
          cleanupLegacyDummyData();
          setIsSyncConnected(true);
          const freshMeta = getSchoolMeta();
          const freshTeachers = getTeachersList();
          const freshIndex = getSupervisionIndex();
          setSchoolMeta(freshMeta);
          setTeachers(freshTeachers);
          setIndex(freshIndex);
          if (firstTeacher) {
            const freshRec = getTeacherRecord(firstTeacher, freshMeta);
            setCurrentRecord(freshRec);
          }
          setLastSyncTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
        }
      }).catch((err) => {
        console.warn("Initial sync notice:", err?.message || err);
      });
    }

    setIsInitialized(true);
  }, []);

  // Strategi Penarikan Data yang Efektif dan Aman:
  // 1. Tidak menggunakan timer interval 30 detik (agar guru bebas menyelesaikan input tanpa terhapus)
  // 2. Menarik data terbaru dari Spreadsheet saat:
  //    - Berpindah ke tab "Rekap" atau "Analisis"
  //    - Kembali membuka tab / jendela browser di HP/Laptop (window focus & visibility)
  //    - Polling periodik (setiap 30 detik) saat tab aktif sehingga device lain langsung melihat hasil update
  useEffect(() => {
    if (!isInitialized) return;

    const pullLatest = () => {
      const syncConf = getSyncConfig();
      if (syncConf.autoSync && syncConf.webAppUrl && !isSyncing) {
        triggerAutoSync(false);
      }
    };

    if (activeTab === "rekap" || activeTab === "analisis") {
      pullLatest();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pullLatest();
      }
    };

    window.addEventListener("focus", pullLatest);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const pollingInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        pullLatest();
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", pullLatest);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollingInterval);
    };
  }, [isInitialized, activeTab, isSyncing, activeTeacher]);

  // When active teacher changes, load teacher record (uppercase guaranteed)
  const handleSelectTeacher = (name: string) => {
    const upper = name.trim().toUpperCase();
    setActiveTeacher(upper);
    const rec = getTeacherRecord(upper, schoolMeta);
    setCurrentRecord(rec);
  };

  // Simpan hasil supervisi:
  // 1. Simpan ke memori lokal browser seketika
  // 2. Langsung kirim (push) ke Google Spreadsheet dengan prioritas data guru ini
  // 3. Mengembalikan status sukses ke form
  const handleSaveRecord = async (recordToSave: SupervisionRecord): Promise<{ success: boolean; cloudSuccess?: boolean; message?: string }> => {
    const upperRecord: SupervisionRecord = {
      ...recordToSave,
      name: recordToSave.name.trim().toUpperCase(),
      updatedAt: recordToSave.updatedAt || new Date().toISOString()
    };
    const updatedIndex = saveTeacherRecord(upperRecord);
    setIndex({ ...updatedIndex });
    setCurrentRecord(upperRecord);

    const syncConf = getSyncConfig();
    if (syncConf.autoSync && syncConf.webAppUrl) {
      setIsSyncing(true);
      try {
        const pushRes = await pushToSpreadsheet(syncConf.webAppUrl, upperRecord);
        if (pushRes.success) {
          setIsSyncConnected(true);
          const nowFormatted = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          setLastSyncTime(nowFormatted);
          setIndex(getSupervisionIndex());
          return { 
            success: true, 
            cloudSuccess: true, 
            message: pushRes.message || "Tersimpan di perangkat & terkirim ke Google Spreadsheet!" 
          };
        } else {
          return { 
            success: true, 
            cloudSuccess: false, 
            message: pushRes.message || "Tersimpan di perangkat lokal." 
          };
        }
      } catch (err: any) {
        return { success: true, cloudSuccess: false, message: "Tersimpan di perangkat lokal." };
      } finally {
        setIsSyncing(false);
      }
    }

    return { success: true, cloudSuccess: false, message: "Tersimpan aman di memori perangkat." };
  };

  // Update school meta with autoSync push
  const handleUpdateSchoolMeta = (newMeta: SchoolMeta) => {
    setSchoolMeta(newMeta);
    saveSchoolMeta(newMeta);

    const syncConf = getSyncConfig();
    if (syncConf.autoSync && syncConf.webAppUrl) {
      pushToSpreadsheet(syncConf.webAppUrl).catch((err) => {
        console.warn("Auto-sync meta push error:", err);
      });
    }
  };

  // Add new teacher in uppercase with autoSync push
  const handleAddTeacher = (newTeacherName: string) => {
    const upper = newTeacherName.trim().toUpperCase();
    if (!upper) return;
    if (teachers.includes(upper)) {
      handleSelectTeacher(upper);
      return;
    }
    const updated = [upper, ...teachers];
    setTeachers(updated);
    saveTeachersList(updated);
    handleSelectTeacher(upper);

    const syncConf = getSyncConfig();
    if (syncConf.autoSync && syncConf.webAppUrl) {
      pushToSpreadsheet(syncConf.webAppUrl).catch((err) => {
        console.warn("Auto-sync teacher push error:", err);
      });
    }
  };

  // Delete record for a teacher with autoSync push
  const handleDeleteRecord = (name: string) => {
    const upper = name.trim().toUpperCase();
    const updatedIndex = deleteTeacherRecord(upper);
    setIndex({ ...updatedIndex });
    if (activeTeacher === upper) {
      const rec = getTeacherRecord(upper, schoolMeta);
      setCurrentRecord(rec);
    }

    const syncConf = getSyncConfig();
    if (syncConf.autoSync && syncConf.webAppUrl) {
      pushToSpreadsheet(syncConf.webAppUrl).catch((err) => {
        console.warn("Auto-sync delete push error:", err);
      });
    }
  };

  // Switch to print view for a specific teacher
  const handlePrintTeacher = (recordToPrint: SupervisionRecord) => {
    const upper = recordToPrint.name.trim().toUpperCase();
    setActiveTeacher(upper);
    setCurrentRecord({
      ...recordToPrint,
      name: upper
    });
    setActiveTab("print");
  };

  // Handlers for locked buttons requiring password "kikyadmin"
  const handleOpenSyncWithAuth = () => {
    setPendingAdminTarget("sync");
    setAdminActionTitle("Sinkronisasi Database Spreadsheet");
    setIsAdminAuthOpen(true);
  };

  const handleOpenBackupWithAuth = () => {
    setPendingAdminTarget("backup");
    setAdminActionTitle("Cadangan & Pemulihan (Backup / JSON)");
    setIsAdminAuthOpen(true);
  };

  const handleAdminAuthSuccess = () => {
    if (pendingAdminTarget === "sync") {
      setIsSyncModalOpen(true);
    } else if (pendingAdminTarget === "backup") {
      setIsBackupModalOpen(true);
    }
    setPendingAdminTarget(null);
  };

  // Data restored callback
  const handleDataRestored = () => {
    const loadedMeta = getSchoolMeta();
    const loadedTeachers = getTeachersList();
    const loadedIndex = getSupervisionIndex();

    setSchoolMeta(loadedMeta);
    setTeachers(loadedTeachers);
    setIndex(loadedIndex);

    const currentOrFirst = loadedTeachers.includes(activeTeacher)
      ? activeTeacher
      : loadedTeachers[0] || "";

    setActiveTeacher(currentOrFirst);
    if (currentOrFirst) {
      setCurrentRecord(getTeacherRecord(currentOrFirst, loadedMeta));
    }

    const syncConf = getSyncConfig();
    setIsSyncConnected(!!syncConf.webAppUrl && syncConf.webAppUrl.includes("/exec"));
  };

  if (!isInitialized || !currentRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">Memuat data supervisi guru...</p>
        </div>
      </div>
    );
  }

  const completedCount = Object.keys(index).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-indigo-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Subtle ambient lighting for Bento aesthetic */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 sm:py-7 flex flex-col min-h-screen">
        <div className="flex-1">
          {/* Top Header & School Details Bento Card */}
          <Header
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab !== "input") {
                triggerAutoSync(false);
              }
            }}
            schoolMeta={schoolMeta}
            onUpdateSchoolMeta={handleUpdateSchoolMeta}
            onOpenBackupModal={handleOpenBackupWithAuth}
            onOpenSyncModal={handleOpenSyncWithAuth}
            onOpenKopCustomizer={() => setIsKopCustomizerOpen(true)}
            isSyncConnected={isSyncConnected}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onQuickSync={() => triggerAutoSync(false)}
            totalTeachers={teachers.length}
            completedCount={completedCount}
          />

          {/* Tab 1: Input Supervisi (Sidebar + Evaluation Form) */}
          {activeTab === "input" && (
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
              <TeacherSidebar
                teachers={teachers}
                activeTeacher={activeTeacher}
                onSelectTeacher={handleSelectTeacher}
                index={index}
                onAddTeacher={handleAddTeacher}
                onSync={() => triggerAutoSync(false)}
                isSyncing={isSyncing}
              />

              <SupervisionForm
                record={currentRecord}
                schoolMeta={schoolMeta}
                onSave={handleSaveRecord}
                onPrintTeacher={handlePrintTeacher}
              />
            </div>
          )}

          {/* Tab 2: Rekap Sekolah (Dashboard & Table) */}
          {activeTab === "rekap" && (
            <RekapDashboard
              teachers={teachers}
              index={index}
              schoolMeta={schoolMeta}
              onSelectTeacherForEdit={(name) => {
                handleSelectTeacher(name);
                setActiveTab("input");
              }}
              onSelectTeacherForPrint={(name) => {
                handleSelectTeacher(name);
                setActiveTab("print");
              }}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {/* Tab 3: Cetak Lembar Instrumen / Rapor */}
          {activeTab === "print" && (
            <PrintSheet
              record={currentRecord}
              schoolMeta={schoolMeta}
              teachers={teachers}
              onSelectTeacher={handleSelectTeacher}
              onBack={() => setActiveTab("input")}
              onOpenKopCustomizer={() => setIsKopCustomizerOpen(true)}
            />
          )}

          {/* Tab 4: Analisis 19 Indikator & Rekomendasi PKB */}
          {activeTab === "analisis" && (
            <AnalyticsDashboard
              teachers={teachers}
              index={index}
              schoolMeta={schoolMeta}
            />
          )}
        </div>

        {/* Small Watermark Footer */}
        <footer className="no-print mt-12 mb-4 text-center border-t border-neutral-900/80 pt-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/50 border border-neutral-800 text-neutral-500 text-[11px] font-mono tracking-wider select-none">
            <span>kikybahsoan - smkn2gorontalo</span>
          </div>
        </footer>

        {/* Kop Surat & Logo Customizer Modal */}
        <KopCustomizerModal
          isOpen={isKopCustomizerOpen}
          onClose={() => setIsKopCustomizerOpen(false)}
          schoolMeta={schoolMeta}
          onSave={handleUpdateSchoolMeta}
        />

        {/* Backup & Restore Modal */}
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          onDataRestored={handleDataRestored}
        />

        {/* Google Spreadsheet Cloud Sync Modal */}
        <SpreadsheetSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          onSyncCompleted={handleDataRestored}
        />

        {/* Admin Password Verification Modal */}
        <AdminAuthModal
          isOpen={isAdminAuthOpen}
          onClose={() => {
            setIsAdminAuthOpen(false);
            setPendingAdminTarget(null);
          }}
          onSuccess={handleAdminAuthSuccess}
          actionTitle={adminActionTitle}
        />
      </main>
    </div>
  );
}
