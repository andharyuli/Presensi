import React, { useState, useEffect } from 'react';
import {
  getStoredClasses,
  saveStoredClasses,
  getStoredStudents,
  saveStoredStudents,
  getStoredAttendance,
  saveStoredAttendance,
  getStoredSchoolProfile,
  saveStoredSchoolProfile,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredTemplates,
  saveStoredTemplates,
  clearAllStudentsData,
  resetAllToDefault,
} from './utils/storage';
import {
  initializeFirestoreData,
  subscribeToClasses,
  subscribeToStudents,
  subscribeToAttendance,
  subscribeToSchoolProfile,
  subscribeToNotifications,
  saveAttendanceRecordToFirebase,
  saveBatchAttendanceToFirebase,
  saveStudentToFirebase,
  saveBatchStudentsToFirebase,
  deleteStudentFromFirebase,
  deleteBatchStudentsFromFirebase,
  saveClassToFirebase,
  deleteClassFromFirebase,
  saveSchoolProfileToFirebase,
  saveNotificationToFirebase,
  saveBatchNotificationsToFirebase,
  resetFirestoreToDefault,
} from './utils/firebase';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassRoom,
  ParentNotification,
  SchoolProfile,
  Student,
} from './types';
import { todayString } from './data/initialData';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ClassRollcall } from './components/ClassRollcall';
import { ParentNotifications } from './components/ParentNotifications';
import { ClassManagement } from './components/ClassManagement';
import { StudentManagement } from './components/StudentManagement';
import { TodayAbsenceList } from './components/TodayAbsenceList';
import { StudentDetailModal } from './components/StudentDetailModal';
import { ExportModal } from './components/ExportModal';
import { RotateCcw, ShieldCheck, Heart, Cloud, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Main Data States
  const [classes, setClasses] = useState<ClassRoom[]>(getStoredClasses);
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(getStoredSchoolProfile);
  const [notifications, setNotifications] = useState<ParentNotification[]>(getStoredNotifications);
  const [templates, setTemplates] = useState(getStoredTemplates);

  // Cloud Firestore Sync State
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);

  // UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-7a');

  // Modals
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // 1. Initialize Firestore Database & Subscribe in Real-Time
  useEffect(() => {
    let unsubscribeClasses: (() => void) | undefined;
    let unsubscribeStudents: (() => void) | undefined;
    let unsubscribeAttendance: (() => void) | undefined;
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeNotifs: (() => void) | undefined;

    async function setupFirebaseSync() {
      try {
        setIsLoadingCloud(true);
        // Seed if empty
        await initializeFirestoreData();
        setIsCloudConnected(true);

        // Realtime Subscriptions
        unsubscribeClasses = subscribeToClasses(
          (data) => {
            if (data && data.length > 0) {
              setClasses(data);
              saveStoredClasses(data);
            }
          },
          () => setIsCloudConnected(false)
        );

        unsubscribeStudents = subscribeToStudents(
          (data) => {
            if (data && data.length > 0) {
              setStudents(data);
              saveStoredStudents(data);
            }
          },
          () => setIsCloudConnected(false)
        );

        unsubscribeAttendance = subscribeToAttendance(
          (data) => {
            if (data) {
              setAttendanceRecords(data);
              saveStoredAttendance(data);
            }
          },
          () => setIsCloudConnected(false)
        );

        unsubscribeProfile = subscribeToSchoolProfile(
          (data) => {
            if (data) {
              setSchoolProfile(data);
              saveStoredSchoolProfile(data);
            }
          },
          () => setIsCloudConnected(false)
        );

        unsubscribeNotifs = subscribeToNotifications(
          (data) => {
            if (data) {
              setNotifications(data);
              saveStoredNotifications(data);
            }
          },
          () => setIsCloudConnected(false)
        );
      } catch (err) {
        console.warn('Firebase Firestore offline/fallback to localStorage mode:', err);
        setIsCloudConnected(false);
      } finally {
        setIsLoadingCloud(false);
      }
    }

    setupFirebaseSync();

    return () => {
      if (unsubscribeClasses) unsubscribeClasses();
      if (unsubscribeStudents) unsubscribeStudents();
      if (unsubscribeAttendance) unsubscribeAttendance();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, []);

  // Sync to localStorage as offline fallback
  useEffect(() => {
    saveStoredClasses(classes);
  }, [classes]);

  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  useEffect(() => {
    saveStoredAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    saveStoredSchoolProfile(schoolProfile);
  }, [schoolProfile]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveStoredTemplates(templates);
  }, [templates]);

  // Handler: Update Attendance for single student
  const handleUpdateAttendance = async (
    studentId: string,
    classId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
    time?: string,
    lateMinutes?: number
  ) => {
    const existingIdx = attendanceRecords.findIndex((r) => r.studentId === studentId && r.date === date);
    const newRec: AttendanceRecord = {
      id: existingIdx >= 0 ? attendanceRecords[existingIdx].id : `att-${studentId}-${date}`,
      studentId,
      classId,
      date,
      status,
      time: time || (status === 'HADIR' ? '06:50' : '-'),
      notes: notes || '',
      recordedBy: 'Guru Piket & Wali Kelas',
      lateMinutes,
      updatedAt: new Date().toISOString(),
    };

    // Update local state instantly for snappy UI
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.studentId === studentId && r.date === date);
      let next: AttendanceRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = newRec;
      } else {
        next = [...prev, newRec];
      }
      saveStoredAttendance(next);
      return next;
    });

    // Sync to Firestore Cloud
    try {
      await saveAttendanceRecordToFirebase(newRec);
    } catch (e) {
      console.error('Error saving attendance to Firebase:', e);
    }

    // Auto update or generate pending parent notification if status is SAKIT, IZIN, or ALPHA
    if (status === 'SAKIT' || status === 'IZIN' || status === 'ALPHA') {
      const student = students.find((s) => s.id === studentId);
      const currentClass = classes.find((c) => c.id === classId);
      if (student) {
        const existingNotifIdx = notifications.findIndex(
          (n) => n.studentId === studentId && n.date === date
        );

        let targetNotif: ParentNotification;

        if (existingNotifIdx >= 0) {
          targetNotif = {
            ...notifications[existingNotifIdx],
            status,
            notes,
          };
        } else {
          targetNotif = {
            id: `notif-${studentId}-${date}`,
            studentId,
            studentName: student.name,
            className: currentClass?.name || '-',
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            date,
            status,
            notes,
            message: `Yth. Bapak/Ibu Wali Murid dari ${student.name},\n\nKami menginformasikan presensi ananda hari ini tercatat: ${status} (${notes || '-'}).\n\nTerima kasih,\n${schoolProfile.name}`,
            channel: 'WHATSAPP',
            deliveryStatus: 'PENDING',
          };
        }

        setNotifications((prevNotifs) => {
          const idx = prevNotifs.findIndex((n) => n.id === targetNotif.id);
          if (idx >= 0) {
            const next = [...prevNotifs];
            next[idx] = targetNotif;
            return next;
          }
          return [...prevNotifs, targetNotif];
        });

        // Persist notification to Firestore
        try {
          await saveNotificationToFirebase(targetNotif);
        } catch (e) {
          console.error('Error saving notification to Firebase:', e);
        }
      }
    }
  };

  // Handler: Bulk Set All Present for class
  const handleBulkSetPresent = async (classId: string, date: string) => {
    const classStudentIds = students
      .filter((s) => s.classId === classId && s.isActive)
      .map((s) => s.id);

    const newBatch: AttendanceRecord[] = classStudentIds.map((stId) => ({
      id: `att-${stId}-${date}`,
      studentId: stId,
      classId,
      date,
      status: 'HADIR',
      time: '06:45',
      notes: '',
      recordedBy: 'Guru Piket & Wali Kelas',
      updatedAt: new Date().toISOString(),
    }));

    setAttendanceRecords((prev) => {
      const prevWithoutTodayClass = prev.filter(
        (r) => !(r.classId === classId && r.date === date)
      );
      const next = [...prevWithoutTodayClass, ...newBatch];
      saveStoredAttendance(next);
      return next;
    });

    try {
      await saveBatchAttendanceToFirebase(newBatch);
    } catch (e) {
      console.error('Error bulk saving attendance to Firebase:', e);
    }
  };

  // Handlers for Classes
  const handleAddClass = async (newClass: ClassRoom) => {
    setClasses((prev) => [...prev, newClass]);
    try {
      await saveClassToFirebase(newClass);
    } catch (e) {
      console.error('Error adding class to Firebase:', e);
    }
  };

  const handleUpdateClass = async (updatedClass: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    try {
      await saveClassToFirebase(updatedClass);
    } catch (e) {
      console.error('Error updating class in Firebase:', e);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    try {
      await deleteClassFromFirebase(classId);
    } catch (e) {
      console.error('Error deleting class from Firebase:', e);
    }
  };

  // Handlers for Students
  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    try {
      await saveStudentToFirebase(newStudent);
    } catch (e) {
      console.error('Error adding student to Firebase:', e);
    }
  };

  const handleBulkAddStudents = async (newStudents: Student[]) => {
    setStudents((prev) => [...prev, ...newStudents]);
    try {
      await saveBatchStudentsToFirebase(newStudents);
    } catch (e) {
      console.error('Error bulk adding students to Firebase:', e);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    try {
      await saveStudentToFirebase(updatedStudent);
    } catch (e) {
      console.error('Error updating student in Firebase:', e);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    try {
      await deleteStudentFromFirebase(studentId);
    } catch (e) {
      console.error('Error deleting student from Firebase:', e);
    }
  };

  const handleClearAllStudents = async () => {
    const allIds = students.map((s) => s.id);
    setStudents([]);
    setAttendanceRecords([]);
    setNotifications([]);
    clearAllStudentsData();
    try {
      if (allIds.length > 0) {
        await deleteBatchStudentsFromFirebase(allIds);
      }
    } catch (e) {
      console.error('Error clearing students from Firebase:', e);
    }
  };

  const handleClearStudentsByClass = async (classId: string) => {
    const targetStudents = students.filter((s) => s.classId === classId);
    const targetStudentIds = new Set(targetStudents.map((s) => s.id));
    setStudents((prev) => prev.filter((s) => s.classId !== classId));
    setAttendanceRecords((prev) => prev.filter((r) => !targetStudentIds.has(r.studentId)));
    setNotifications((prev) => prev.filter((n) => !targetStudentIds.has(n.studentId)));
    try {
      const idsToDelete = targetStudents.map((s) => s.id);
      if (idsToDelete.length > 0) {
        await deleteBatchStudentsFromFirebase(idsToDelete);
      }
    } catch (e) {
      console.error('Error deleting class students from Firebase:', e);
    }
  };

  const handleDeleteMultipleStudents = async (studentIds: string[]) => {
    const idSet = new Set(studentIds);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    setAttendanceRecords((prev) => prev.filter((r) => !idSet.has(r.studentId)));
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.studentId)));
    try {
      if (studentIds.length > 0) {
        await deleteBatchStudentsFromFirebase(studentIds);
      }
    } catch (e) {
      console.error('Error batch deleting students from Firebase:', e);
    }
  };

  // Handlers for Notifications
  const handleAddOrUpdateNotification = async (notif: ParentNotification) => {
    setNotifications((prev) => {
      const idx = prev.findIndex((n) => n.id === notif.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = notif;
        return next;
      }
      return [...prev, notif];
    });

    try {
      await saveNotificationToFirebase(notif);
    } catch (e) {
      console.error('Error saving notification to Firebase:', e);
    }
  };

  const handleBatchSendNotifications = async (newNotifs: ParentNotification[]) => {
    setNotifications((prev) => {
      const existingMap = new Map(prev.map((n) => [n.id, n]));
      newNotifs.forEach((n) => existingMap.set(n.id, n));
      return Array.from(existingMap.values());
    });

    try {
      await saveBatchNotificationsToFirebase(newNotifs);
    } catch (e) {
      console.error('Error bulk saving notifications to Firebase:', e);
    }
  };

  // Navigation shortcuts
  const navigateToRollcallWithClass = (classId?: string) => {
    if (classId) setSelectedClassId(classId);
    setActiveTab('rollcall');
  };

  // Compute pending notifications count for badge
  const unreadNotifsCount = notifications.filter(
    (n) => n.date === selectedDate && n.deliveryStatus === 'PENDING'
  ).length;

  // Compute absent students count for badge
  const absentStudentsTodayCount = students.filter((s) => {
    const rec = attendanceRecords.find((r) => r.studentId === s.id && r.date === selectedDate);
    return rec && (rec.status === 'SAKIT' || rec.status === 'IZIN' || rec.status === 'ALPHA');
  }).length;

  const handleResetData = async () => {
    if (confirm('Kembalikan semua data ke sampel data awal resmi di Cloud Firebase & Lokal?')) {
      try {
        await resetFirestoreToDefault();
      } catch (e) {
        console.error('Firebase reset error, resetting local:', e);
      }
      resetAllToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        schoolProfile={schoolProfile}
        unreadNotifsCount={unreadNotifsCount}
        absentCount={absentStudentsTodayCount}
        isCloudConnected={isCloudConnected}
        isLoadingCloud={isLoadingCloud}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            classes={classes}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            schoolProfile={schoolProfile}
            onNavigateToRollcall={navigateToRollcallWithClass}
            onNavigateToTodayAbsence={() => setActiveTab('today-absence')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onSelectStudentDetail={(st) => setSelectedStudentForDetail(st)}
          />
        )}

        {activeTab === 'today-absence' && (
          <TodayAbsenceList
            students={students}
            classes={classes}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            schoolProfile={schoolProfile}
            onUpdateAttendance={handleUpdateAttendance}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onSelectStudentDetail={(st) => setSelectedStudentForDetail(st)}
          />
        )}

        {activeTab === 'rollcall' && (
          <ClassRollcall
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            schoolProfile={schoolProfile}
            onUpdateAttendance={handleUpdateAttendance}
            onBulkSetPresent={handleBulkSetPresent}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onSelectStudentDetail={(st) => setSelectedStudentForDetail(st)}
          />
        )}

        {activeTab === 'notifications' && (
          <ParentNotifications
            students={students}
            classes={classes}
            attendanceRecords={attendanceRecords}
            notifications={notifications}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            schoolProfile={schoolProfile}
            templates={templates}
            onSaveTemplates={setTemplates}
            onUpdateNotification={handleAddOrUpdateNotification}
            onAddNotification={handleAddOrUpdateNotification}
            onBatchSendNotifications={handleBatchSendNotifications}
          />
        )}

        {activeTab === 'classes' && (
          <ClassManagement
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            schoolProfile={schoolProfile}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onNavigateToRollcall={navigateToRollcallWithClass}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagement
            students={students}
            classes={classes}
            attendanceRecords={attendanceRecords}
            onAddStudent={handleAddStudent}
            onBulkAddStudents={handleBulkAddStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSelectStudentDetail={(st) => setSelectedStudentForDetail(st)}
            onClearAllStudents={handleClearAllStudents}
            onClearStudentsByClass={handleClearStudentsByClass}
            onDeleteMultipleStudents={handleDeleteMultipleStudents}
          />
        )}
      </main>

      {/* Global Modals */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          classes={classes}
          attendanceRecords={attendanceRecords}
          schoolProfile={schoolProfile}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classes={classes}
        students={students}
        attendanceRecords={attendanceRecords}
        notifications={notifications}
        selectedDate={selectedDate}
        schoolProfile={schoolProfile}
      />

      {/* Modern Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{schoolProfile.name}</span>
            <span>&bull;</span>
            <span>Sistem Informasi Presensi & Rekapitulasi Digital Siswa</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 transition-colors"
              title="Reset ke sampel data awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Cloud</span>
            </button>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Firebase Cloud Firestore Terhubung</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
