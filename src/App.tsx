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
import { RotateCcw, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  // Main Data States
  const [classes, setClasses] = useState<ClassRoom[]>(getStoredClasses);
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(getStoredSchoolProfile);
  const [notifications, setNotifications] = useState<ParentNotification[]>(getStoredNotifications);
  const [templates, setTemplates] = useState(getStoredTemplates);

  // UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-7a');

  // Modals
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Sync to localStorage
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
  const handleUpdateAttendance = (
    studentId: string,
    classId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
    time?: string,
    lateMinutes?: number
  ) => {
    setAttendanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.studentId === studentId && r.date === date);
      const newRec: AttendanceRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `att-${studentId}-${date}`,
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

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newRec;
        return next;
      } else {
        return [...prev, newRec];
      }
    });

    // Auto update or generate pending parent notification if status is SAKIT, IZIN, or ALPHA
    if (status === 'SAKIT' || status === 'IZIN' || status === 'ALPHA') {
      const student = students.find((s) => s.id === studentId);
      const currentClass = classes.find((c) => c.id === classId);
      if (student) {
        setNotifications((prevNotifs) => {
          const existingNotifIdx = prevNotifs.findIndex(
            (n) => n.studentId === studentId && n.date === date
          );
          if (existingNotifIdx >= 0) {
            const nextNotifs = [...prevNotifs];
            nextNotifs[existingNotifIdx] = {
              ...nextNotifs[existingNotifIdx],
              status,
              notes,
            };
            return nextNotifs;
          } else {
            return [
              ...prevNotifs,
              {
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
              },
            ];
          }
        });
      }
    }
  };

  // Handler: Bulk Set All Present for class
  const handleBulkSetPresent = (classId: string, date: string) => {
    const classStudentIds = students
      .filter((s) => s.classId === classId && s.isActive)
      .map((s) => s.id);

    setAttendanceRecords((prev) => {
      const prevWithoutTodayClass = prev.filter(
        (r) => !(r.classId === classId && r.date === date)
      );

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

      return [...prevWithoutTodayClass, ...newBatch];
    });
  };

  // Handlers for Classes
  const handleAddClass = (newClass: ClassRoom) => {
    setClasses((prev) => [...prev, newClass]);
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
  };

  const handleDeleteClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  // Handlers for Students
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    setStudents((prev) => [...prev, ...newStudents]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleClearAllStudents = () => {
    setStudents([]);
    setAttendanceRecords([]);
    setNotifications([]);
    clearAllStudentsData();
  };

  const handleClearStudentsByClass = (classId: string) => {
    const targetStudentIds = new Set(students.filter((s) => s.classId === classId).map((s) => s.id));
    setStudents((prev) => prev.filter((s) => s.classId !== classId));
    setAttendanceRecords((prev) => prev.filter((r) => !targetStudentIds.has(r.studentId)));
    setNotifications((prev) => prev.filter((n) => !targetStudentIds.has(n.studentId)));
  };

  const handleDeleteMultipleStudents = (studentIds: string[]) => {
    const idSet = new Set(studentIds);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    setAttendanceRecords((prev) => prev.filter((r) => !idSet.has(r.studentId)));
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.studentId)));
  };

  // Handlers for Notifications
  const handleAddOrUpdateNotification = (notif: ParentNotification) => {
    setNotifications((prev) => {
      const idx = prev.findIndex((n) => n.id === notif.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = notif;
        return next;
      }
      return [...prev, notif];
    });
  };

  const handleBatchSendNotifications = (newNotifs: ParentNotification[]) => {
    setNotifications((prev) => {
      const existingMap = new Map(prev.map((n) => [n.id, n]));
      newNotifs.forEach((n) => existingMap.set(n.id, n));
      return Array.from(existingMap.values());
    });
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

  const handleResetData = () => {
    if (confirm('Kembalikan semua data ke sampel data awal resmi?')) {
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
              <span>Reset Data Demo</span>
            </button>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Versi 2.4 Terverifikasi</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
