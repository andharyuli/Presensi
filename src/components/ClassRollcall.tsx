import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  HeartPulse,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  Download,
  FileText,
  Printer,
  Search,
  Filter,
  CheckCheck,
  Send,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassRoom,
  SchoolProfile,
  Student,
  ParentNotification,
} from '../types';
import {
  formatIndonesianDate,
  exportAttendanceToPDF,
  exportAttendanceToExcel,
  getStatusBadgeText,
} from '../utils/exportUtils';

interface ClassRollcallProps {
  classes: ClassRoom[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schoolProfile: SchoolProfile;
  onUpdateAttendance: (
    studentId: string,
    classId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
    time?: string,
    lateMinutes?: number
  ) => void;
  onBulkSetPresent: (classId: string, date: string) => void;
  onNavigateToNotifications: () => void;
  onSelectStudentDetail: (student: Student) => void;
}

export const ClassRollcall: React.FC<ClassRollcallProps> = ({
  classes,
  students,
  attendanceRecords,
  notifications,
  selectedClassId,
  setSelectedClassId,
  selectedDate,
  setSelectedDate,
  schoolProfile,
  onUpdateAttendance,
  onBulkSetPresent,
  onNavigateToNotifications,
  onSelectStudentDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // Students of current class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter((s) => s.classId === currentClass.id && s.isActive);
  }, [students, currentClass]);

  // Stats for this class on selected date
  const classStats = useMemo(() => {
    let present = 0;
    let sick = 0;
    let permitted = 0;
    let absent = 0;
    let late = 0;

    classStudents.forEach((st) => {
      const rec = attendanceRecords.find(
        (r) => r.studentId === st.id && r.date === selectedDate
      );
      const status = rec ? rec.status : 'HADIR';

      if (status === 'HADIR') present++;
      else if (status === 'SAKIT') sick++;
      else if (status === 'IZIN') permitted++;
      else if (status === 'ALPHA') absent++;
      else if (status === 'TERLAMBAT') {
        late++;
        present++;
      }
    });

    const total = classStudents.length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

    return {
      total,
      present,
      sick,
      permitted,
      absent,
      late,
      rate,
    };
  }, [classStudents, attendanceRecords, selectedDate]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return classStudents.filter((st) => {
      const matchSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.nisn.includes(searchQuery);

      if (!matchSearch) return false;

      if (statusFilter === 'ALL') return true;

      const rec = attendanceRecords.find(
        (r) => r.studentId === st.id && r.date === selectedDate
      );
      const status = rec ? rec.status : 'HADIR';

      if (statusFilter === 'ABSENT_ONLY') {
        return status === 'SAKIT' || statusFilter === 'IZIN' || status === 'ALPHA';
      }

      return status === statusFilter;
    });
  }, [classStudents, searchQuery, statusFilter, attendanceRecords, selectedDate]);

  const handleStatusChange = (
    student: Student,
    newStatus: AttendanceStatus
  ) => {
    const defaultTime =
      newStatus === 'HADIR'
        ? '06:50'
        : newStatus === 'TERLAMBAT'
        ? '07:15'
        : '-';

    const defaultNotes =
      newStatus === 'SAKIT'
        ? 'Sakit (Konfirmasi Orang Tua)'
        : newStatus === 'IZIN'
        ? 'Izin keperluan keluarga'
        : newStatus === 'ALPHA'
        ? 'Tanpa keterangan'
        : newStatus === 'TERLAMBAT'
        ? 'Terlambat masuk kelas'
        : '';

    onUpdateAttendance(
      student.id,
      student.classId,
      selectedDate,
      newStatus,
      defaultNotes,
      defaultTime,
      newStatus === 'TERLAMBAT' ? 15 : undefined
    );
  };

  const handleSaveNotes = (student: Student) => {
    const rec = attendanceRecords.find(
      (r) => r.studentId === student.id && r.date === selectedDate
    );
    const status = rec ? rec.status : 'HADIR';
    const time = rec ? rec.time : '07:00';

    onUpdateAttendance(
      student.id,
      student.classId,
      selectedDate,
      status,
      tempNotes,
      time
    );
    setEditingNotesId(null);
  };

  const handleExportPDF = () => {
    exportAttendanceToPDF({
      targetClass: currentClass,
      students,
      records: attendanceRecords,
      date: selectedDate,
      schoolProfile,
      allClasses: classes,
    });
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel({
      targetClass: currentClass,
      students,
      records: attendanceRecords,
      date: selectedDate,
      schoolProfile,
      notifications,
    });
  };

  const generateWhatsAppDirectLink = (student: Student, status: AttendanceStatus, notes?: string) => {
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const text = `Yth. Bapak/Ibu Wali Murid dari ${student.name} (${currentClass?.name}),\n\nKami menginformasikan presensi ananda pada ${formatIndonesianDate(selectedDate)} tercatat: *${status}* (${notes || '-'}).\n\nTerima kasih,\n${schoolProfile.name}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card: Class Info & Filters */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-5">
        {/* Class Selection & Date Picker */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Kelas (21 Kelas)
              </label>
              <div className="relative">
                <select
                  id="rollcall-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 font-bold text-slate-900 rounded-xl px-4 py-2 text-sm pr-9 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Tingkat 7 (7A - 7G)">
                    {classes.filter((c) => c.gradeLevel === '7').map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.name} &bull; {cls.roomNumber}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tingkat 8 (8A - 8G)">
                    {classes.filter((c) => c.gradeLevel === '8').map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.name} &bull; {cls.roomNumber}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tingkat 9 (9A - 9G)">
                    {classes.filter((c) => c.gradeLevel === '9').map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.name} &bull; {cls.roomNumber}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tanggal Presensi
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  id="rollcall-date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
            <button
              id="rollcall-btn-bulk-present"
              onClick={() => onBulkSetPresent(currentClass.id, selectedDate)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors"
              title="Set seluruh siswa di kelas ini menjadi HADIR"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Semua Hadir</span>
            </button>

            <button
              id="rollcall-btn-export-pdf"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF Resmi</span>
            </button>

            <button
              id="rollcall-btn-export-excel"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              id="rollcall-btn-notif-center"
              onClick={onNavigateToNotifications}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Notifikasi Ortu</span>
            </button>
          </div>
        </div>

        {/* 21 Classes Quick Switcher Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Pilih Cepat Kelas SMPN 1 Pundong (21 Rombel):</span>
            <span className="text-blue-600">Aktif: Kelas {currentClass?.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Kls 7:</span>
            {classes.filter((c) => c.gradeLevel === '7').map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-2xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cls.name}
              </button>
            ))}

            <span className="text-[11px] font-bold text-slate-400 ml-2 mr-1">Kls 8:</span>
            {classes.filter((c) => c.gradeLevel === '8').map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-2xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cls.name}
              </button>
            ))}

            <span className="text-[11px] font-bold text-slate-400 ml-2 mr-1">Kls 9:</span>
            {classes.filter((c) => c.gradeLevel === '9').map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-2xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {/* Homeroom & Piket Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Wali Kelas:</span>{' '}
            <strong className="text-slate-800 font-semibold">{currentClass?.homeroomTeacher}</strong>{' '}
            <span className="text-slate-500">(NIP. {currentClass?.homeroomNIP})</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Guru Piket Hari Ini:</span>{' '}
            <strong className="text-slate-800 font-semibold">{schoolProfile.dutyTeacherToday.split('&')[0]}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Ruang Kelas & Kapasitas:</span>{' '}
            <strong className="text-slate-800 font-semibold">{currentClass?.roomNumber}</strong>{' '}
            <span className="text-slate-500">({classStudents.length} Siswa Terdaftar)</span>
          </div>
        </div>

        {/* Realtime Attendance Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500">Total Siswa</span>
            <div className="text-xl font-bold text-slate-900">{classStats.total}</div>
          </div>
          <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700">Tingkat Hadir</span>
            <div className="text-xl font-extrabold text-blue-700">{classStats.rate}%</div>
          </div>
          <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-700">Hadir (H)</span>
            <div className="text-xl font-bold text-emerald-800">{classStats.present}</div>
          </div>
          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-700">Sakit (S)</span>
            <div className="text-xl font-bold text-amber-800">{classStats.sick}</div>
          </div>
          <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
            <span className="text-[11px] font-semibold text-indigo-700">Izin (I)</span>
            <div className="text-xl font-bold text-indigo-800">{classStats.permitted}</div>
          </div>
          <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-700">Alpha (A)</span>
            <div className="text-xl font-bold text-rose-800">{classStats.absent}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            id="rollcall-search-input"
            type="text"
            placeholder="Cari nama siswa atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { key: 'ALL', label: 'Semua' },
            { key: 'HADIR', label: 'Hadir' },
            { key: 'SAKIT', label: 'Sakit' },
            { key: 'IZIN', label: 'Izin' },
            { key: 'ALPHA', label: 'Alpha' },
            { key: 'TERLAMBAT', label: 'Terlambat' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.key
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rollcall Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Siswa / NISN</th>
                <th className="py-3.5 px-2 text-center w-12">L/P</th>
                <th className="py-3.5 px-4 text-center min-w-[280px]">Status Kehadiran</th>
                <th className="py-3.5 px-3 text-center w-24">Waktu</th>
                <th className="py-3.5 px-4 min-w-[200px]">Keterangan</th>
                <th className="py-3.5 px-4 min-w-[140px] text-right">Kontak Ortu & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600 text-xs">
                        Belum ada siswa terdaftar di Kelas {currentClass?.name || ''}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Silakan input data atau import file Excel di menu Manajemen Siswa.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const record = attendanceRecords.find(
                    (r) => r.studentId === student.id && r.date === selectedDate
                  );
                  const status = record ? record.status : 'HADIR';
                  const time = record?.time || '06:50';
                  const notes = record?.notes || '';
                  const notif = notifications.find(
                    (n) => n.studentId === student.id && n.date === selectedDate
                  );

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Number */}
                      <td className="py-3 px-3 text-center font-semibold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Name & NISN */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectStudentDetail(student)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{student.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NISN: {student.nisn}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            student.gender === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* Status Selector Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                          {/* Hadir */}
                          <button
                            id={`status-hadir-${student.id}`}
                            onClick={() => handleStatusChange(student, 'HADIR')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              status === 'HADIR'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-white/80'
                            }`}
                          >
                            <span>H</span>
                            <span className="hidden sm:inline text-[10px]">Hadir</span>
                          </button>

                          {/* Sakit */}
                          <button
                            id={`status-sakit-${student.id}`}
                            onClick={() => handleStatusChange(student, 'SAKIT')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              status === 'SAKIT'
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-white/80'
                            }`}
                          >
                            <span>S</span>
                            <span className="hidden sm:inline text-[10px]">Sakit</span>
                          </button>

                          {/* Izin */}
                          <button
                            id={`status-izin-${student.id}`}
                            onClick={() => handleStatusChange(student, 'IZIN')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              status === 'IZIN'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-white/80'
                            }`}
                          >
                            <span>I</span>
                            <span className="hidden sm:inline text-[10px]">Izin</span>
                          </button>

                          {/* Alpha */}
                          <button
                            id={`status-alpha-${student.id}`}
                            onClick={() => handleStatusChange(student, 'ALPHA')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              status === 'ALPHA'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-white/80'
                            }`}
                          >
                            <span>A</span>
                            <span className="hidden sm:inline text-[10px]">Alpha</span>
                          </button>

                          {/* Terlambat */}
                          <button
                            id={`status-late-${student.id}`}
                            onClick={() => handleStatusChange(student, 'TERLAMBAT')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                              status === 'TERLAMBAT'
                                ? 'bg-orange-500 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-white/80'
                            }`}
                          >
                            <span>T</span>
                            <span className="hidden sm:inline text-[10px]">Telat</span>
                          </button>
                        </div>
                      </td>

                      {/* Arrival Time */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        {time}
                      </td>

                      {/* Notes / Remarks */}
                      <td className="py-3 px-4">
                        {editingNotesId === student.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Masukkan keterangan..."
                              className="w-full px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNotes(student);
                                if (e.key === 'Escape') setEditingNotesId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveNotes(student)}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(student.id);
                              setTempNotes(notes);
                            }}
                            className="cursor-pointer text-slate-600 hover:text-blue-600 hover:underline flex items-center gap-1"
                            title="Klik untuk mengubah catatan"
                          >
                            <span>{notes || <em className="text-slate-300">Klik isi catatan</em>}</span>
                          </div>
                        )}
                      </td>

                      {/* Parent Phone & WhatsApp Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'HADIR' && (
                            <a
                              href={generateWhatsAppDirectLink(student, status, notes)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                              title="Kirim pesan WhatsApp ke Wali Murid"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kirim WA</span>
                            </a>
                          )}

                          <div className="text-[11px] text-slate-500 font-medium">
                            {student.parentName.split(',')[0]}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
