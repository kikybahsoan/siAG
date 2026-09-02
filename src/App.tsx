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
  seedSampleRecordsIfEmpty 
} from "./utils/storage";
import { Header } from "./components/Header";
import { TeacherSidebar } from "./components/InputView/TeacherSidebar";
import { SupervisionForm } from "./components/InputView/SupervisionForm";
import { RekapDashboard } from "./components/RekapView/RekapDashboard";
import { PrintSheet } from "./components/PrintView/PrintSheet";
import { AnalyticsDashboard } from "./components/AnalyticsView/AnalyticsDashboard";
import { BackupModal } from "./components/BackupModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<string>("");
  const [schoolMeta, setSchoolMeta] = useState<SchoolMeta>(getSchoolMeta());
  const [index, setIndex] = useState<SupervisionIndex>({});
  const [currentRecord, setCurrentRecord] = useState<SupervisionRecord | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize application data
  useEffect(() => {
    seedSampleRecordsIfEmpty();

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

    setIsInitialized(true);
  }, []);

  // When active teacher changes, load teacher record
  const handleSelectTeacher = (name: string) => {
    setActiveTeacher(name);
    const rec = getTeacherRecord(name, schoolMeta);
    setCurrentRecord(rec);
  };

  // Save record
  const handleSaveRecord = (recordToSave: SupervisionRecord) => {
    const updatedIndex = saveTeacherRecord(recordToSave);
    setIndex({ ...updatedIndex });
    setCurrentRecord(recordToSave);
  };

  // Update school meta
  const handleUpdateSchoolMeta = (newMeta: SchoolMeta) => {
    setSchoolMeta(newMeta);
    saveSchoolMeta(newMeta);
  };

  // Add new teacher
  const handleAddTeacher = (newTeacherName: string) => {
    if (!newTeacherName.trim()) return;
    if (teachers.includes(newTeacherName.trim())) {
      handleSelectTeacher(newTeacherName.trim());
      return;
    }
    const updated = [newTeacherName.trim(), ...teachers];
    setTeachers(updated);
    saveTeachersList(updated);
    handleSelectTeacher(newTeacherName.trim());
  };

  // Delete record for a teacher
  const handleDeleteRecord = (name: string) => {
    const updatedIndex = deleteTeacherRecord(name);
    setIndex({ ...updatedIndex });
    if (activeTeacher === name) {
      const rec = getTeacherRecord(name, schoolMeta);
      setCurrentRecord(rec);
    }
  };

  // Switch to print view for a specific teacher
  const handlePrintTeacher = (recordToPrint: SupervisionRecord) => {
    setActiveTeacher(recordToPrint.name);
    setCurrentRecord(recordToPrint);
    setActiveTab("print");
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

      <main className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 sm:py-7">
        {/* Top Header & School Details Bento Card */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          schoolMeta={schoolMeta}
          onUpdateSchoolMeta={handleUpdateSchoolMeta}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
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

        {/* Backup & Restore Modal */}
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          onDataRestored={handleDataRestored}
        />
      </main>
    </div>
  );
}
