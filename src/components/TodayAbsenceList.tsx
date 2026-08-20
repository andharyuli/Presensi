import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  FileText,
  AlertOctagon,
  Clock,
  Send,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  Users,
  Eye,
  Edit3,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Phone,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassRoom,
  ParentNotification,
  SchoolProfile,
  Student,
} from '../types';
import {
  formatIndonesianDate,
  getStatusBadgeText,
  exportTodayAbsenceReportPDF,
  exportTodayAbsenceReportExcel,
} from '../utils/exportUtils';

interface TodayAbsenceListProps {
  students: Student[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schoolProfile: SchoolProfile;
  onUpdateAttendance?: (
    studentId: string,
    classId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
    time?: string,
    lateMinutes?: number
  ) => void;
  onNavigateToNotifications?: () => void;
  onSelectStudentDetail: (student: Student) => void;
}

export const TodayAbsenceList: React.FC<TodayAbsenceListProps> = ({
  students,
  classes,
  attendanceRecords,
  notifications,
  selectedDate,
  setSelectedDate,
  schoolProfile,
  onUpdateAttendance,
  onNavigateToNotifications,
  onSelectStudentDetail,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL_ABSENT' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT' | 'ALL'>('ALL_ABSENT');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Quick edit modal state
  const [editingItem, setEditingItem] = useState<{
    student: Student;
    record: AttendanceRecord;
    className: string;
  } | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('SAKIT');
  const [editNotes, setEditNotes] = useState<string>('');

  // Quick WhatsApp preview modal
  const [whatsappPreviewItem, setWhatsappPreviewItem] = useState<{
    student: Student;
    record: AttendanceRecord;
    className: string;
    message: string;
  } | null>(null);
  const [copiedSingleMsg, setCopiedSingleMsg] = useState(false);

  // Compute all attendance details for selected date
  const allEnrichedStudents = useMemo(() => {
    return students
      .filter((s) => s.isActive)
      .map((st) => {
        const rec = attendanceRecords.find(
          (r) => r.studentId === st.id && r.date === selectedDate
        );
        const currentStatus = rec ? rec.status : 'HADIR';
        const cls = classes.find((c) => c.id === st.classId);
        const notif = notifications.find(
          (n) => n.studentId === st.id && n.date === selectedDate
        );

        const syntheticRecord: AttendanceRecord = rec || {
          id: `att-${st.id}-${selectedDate}`,
          studentId: st.id,
          classId: st.classId,
          date: selectedDate,
          status: currentStatus,
          time: currentStatus === 'HADIR' ? '06:50' : '-',
          notes: '',
          recordedBy: 'Guru Piket & Wali Kelas',
          updatedAt: new Date().toISOString(),
        };

        return {
          student: st,
          className: cls?.name || '-',
          gradeLevel: cls?.gradeLevel || '',
          homeroomTeacher: cls?.homeroomTeacher || 'Wali Kelas',
          record: syntheticRecord,
          notification: notif,
          parentPhone: st.parentPhone,
        };
      });
  }, [students, classes, attendanceRecords, notifications, selectedDate]);

  // Summary counts for selected date
  const counts = useMemo(() => {
    let sick = 0;
    let permitted = 0;
    let absent = 0;
    let late = 0;
    let present = 0;

    allEnrichedStudents.forEach((item) => {
      const st = item.record.status;
      if (st === 'SAKIT') sick++;
      else if (st === 'IZIN') permitted++;
      else if (st === 'ALPHA') absent++;
      else if (st === 'TERLAMBAT') late++;
      else if (st === 'HADIR') present++;
    });

    const totalAbsent = sick + permitted + absent;
    const totalStudents = allEnrichedStudents.length;

    return {
      sick,
      permitted,
      absent,
      late,
      present,
      totalAbsent,
      totalStudents,
    };
  }, [allEnrichedStudents]);

  // Filtered students according to active filters
  const filteredList = useMemo(() => {
    return allEnrichedStudents.filter((item) => {
      // 1. Status filter
      if (statusFilter === 'ALL_ABSENT') {
        if (
          item.record.status !== 'SAKIT' &&
          item.record.status !== 'IZIN' &&
          item.record.status !== 'ALPHA'
        ) {
          return false;
        }
      } else if (statusFilter !== 'ALL') {
        if (item.record.status !== statusFilter) {
          return false;
        }
      }

      // 2. Grade filter
      if (gradeFilter !== 'ALL' && item.gradeLevel !== gradeFilter) {
        return false;
      }

      // 3. Class filter
      if (classFilter !== 'ALL' && item.student.classId !== classFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(query);
        const matchNisn = item.student.nisn.includes(query);
        const matchParent = item.student.parentName.toLowerCase().includes(query);
        const matchClass = item.className.toLowerCase().includes(query);
        const matchNotes = (item.record.notes || '').toLowerCase().includes(query);

        if (!matchName && !matchNisn && !matchParent && !matchClass && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [allEnrichedStudents, statusFilter, gradeFilter, classFilter, searchQuery]);

  // List of only absent students for exports
  const absentOnlyList = useMemo(() => {
    return allEnrichedStudents.filter(
      (item) =>
        item.record.status === 'SAKIT' ||
        item.record.status === 'IZIN' ||
        item.record.status === 'ALPHA'
    );
  }, [allEnrichedStudents]);

  // Build Copyable WhatsApp Summary Text
  const generateWhatsAppSummaryText = () => {
    const dateFormatted = formatIndonesianDate(selectedDate);
    let text = `📢 *REKAPITULASI PRESENSI HARIAN SISWA*\n`;
    text += `🏫 *${schoolProfile.name}*\n`;
    text += `📅 Tanggal: ${dateFormatted}\n`;
    text += `👨‍🏫 Guru Piket: ${schoolProfile.dutyTeacherToday}\n`;
    text += `──────────────────────\n`;
    text += `📊 *RINGKASAN STATUS:*\n`;
    text += `• Total Siswa: ${counts.totalStudents} siswa\n`;
    text += `• Hadir: ${counts.present + counts.late} siswa\n`;
    text += `• Sakit (S): ${counts.sick} siswa\n`;
    text += `• Izin (I): ${counts.permitted} siswa\n`;
    text += `• Alpha (A): ${counts.absent} siswa\n`;
    text += `• Terlambat (T): ${counts.late} siswa\n`;
    text += `──────────────────────\n\n`;

    if (absentOnlyList.length === 0) {
      text += `✅ *Alhamdulillah, NIHIL / Seluruh siswa hadir tertib hari ini.*\n`;
    } else {
      text += `📋 *DAFTAR SISWA TIDAK HADIR (S/I/A):*\n\n`;

      // Group by Class
      const classMap = new Map<string, typeof absentOnlyList>();
      absentOnlyList.forEach((item) => {
        const list = classMap.get(item.className) || [];
        list.push(item);
        classMap.set(item.className, list);
      });

      Array.from(classMap.entries()).forEach(([className, items]) => {
        text += `📌 *Kelas ${className}* (${items.length} siswa):\n`;
        items.forEach((it, idx) => {
          const statusIcon =
            it.record.status === 'SAKIT'
              ? '🤒 [SAKIT]'
              : it.record.status === 'IZIN'
              ? '✉️ [IZIN]'
              : '❌ [ALPHA]';
          const reason = it.record.notes ? ` - ${it.record.notes}` : '';
          text += `  ${idx + 1}. ${it.student.name} ${statusIcon}${reason}\n`;
        });
        text += `\n`;
      });
    }

    text += `──────────────────────\n`;
    text += `_Laporan otomatis Sistem Presensi Digital ${schoolProfile.name}_\n`;
    return text;
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleExportPDF = () => {
    exportTodayAbsenceReportPDF({
      absentList: statusFilter === 'ALL' ? allEnrichedStudents : filteredList,
      date: selectedDate,
      schoolProfile,
      filterType: statusFilter,
    });
  };

  const handleExportExcel = () => {
    exportTodayAbsenceReportExcel({
      absentList: statusFilter === 'ALL' ? allEnrichedStudents : filteredList,
      date: selectedDate,
      schoolProfile,
    });
  };

  const handleOpenEdit = (item: {
    student: Student;
    record: AttendanceRecord;
    className: string;
  }) => {
    setEditingItem(item);
    setEditStatus(item.record.status);
    setEditNotes(item.record.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateAttendance) return;

    onUpdateAttendance(
      editingItem.student.id,
      editingItem.student.classId,
      selectedDate,
      editStatus,
      editNotes,
      editingItem.record.time
    );

    setEditingItem(null);
  };

  const handleOpenWhatsAppPreview = (item: {
    student: Student;
    record: AttendanceRecord;
    className: string;
  }) => {
    const statusText = getStatusBadgeText(item.record.status);
    const dateFormatted = formatIndonesianDate(selectedDate);
    const msg = `Yth. Bapak/Ibu Wali Murid dari ${item.student.name} (Kelas ${item.className}),\n\nKami dari pihak sekolah ${schoolProfile.name} menginformasikan bahwa pada hari ini, ${dateFormatted}, presensi ananda tercatat: *${statusText.toUpperCase()}* ${item.record.notes ? `(${item.record.notes})` : ''}.\n\nJika ada kekeliruan atau keperluan konfirmasi lebih lanjut, mohon dapat menghubungi Wali Kelas atau Guru Piket.\n\nTerima kasih atas perhatian dan kerjasamanya.\n\n_Hormat kami,_\n*${schoolProfile.name}*`;

    setWhatsappPreviewItem({
      ...item,
      message: msg,
    });
    setCopiedSingleMsg(false);
  };

  const handleSendDirectWhatsApp = (phone: string, msg: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 text-white shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wide backdrop-blur-xs text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Monitoring Kesiswaan & Ketidakhadiran Harian</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>Daftar Presensi Siswa: Izin, Sakit & Alpha</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Daftar seluruh siswa yang <strong>Izin (I)</strong>, <strong>Sakit (S)</strong>, <strong>Alpha (A)</strong>, maupun <strong>Terlambat (T)</strong> pada <strong>{formatIndonesianDate(selectedDate)}</strong> di 21 kelas SMP Negeri 1 Pundong.
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
              <Calendar className="w-4 h-4 text-blue-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
              title="Pilih Hari Ini"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Dynamic Status Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/15 text-xs">
          {/* Total Tidak Hadir */}
          <div
            onClick={() => setStatusFilter('ALL_ABSENT')}
            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
              statusFilter === 'ALL_ABSENT'
                ? 'bg-white/25 border-white text-white ring-2 ring-white/40'
                : 'bg-white/10 border-white/10 text-white/90 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-200">
              <span>Total Tidak Hadir</span>
              <Users className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {counts.totalAbsent} <span className="text-xs font-normal opacity-80">Siswa</span>
            </div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">Sakit + Izin + Alpha</div>
          </div>

          {/* Sakit */}
          <div
            onClick={() => setStatusFilter('SAKIT')}
            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
              statusFilter === 'SAKIT'
                ? 'bg-amber-500/40 border-amber-300 text-white ring-2 ring-amber-400'
                : 'bg-amber-500/15 border-amber-400/20 text-amber-100 hover:bg-amber-500/25'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
              <span>Sakit (S)</span>
              <HeartPulse className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl font-black text-amber-100 mt-1">
              {counts.sick} <span className="text-xs font-normal opacity-80">Siswa</span>
            </div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">Surat dokter & konfirmasi</div>
          </div>

          {/* Izin */}
          <div
            onClick={() => setStatusFilter('IZIN')}
            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
              statusFilter === 'IZIN'
                ? 'bg-indigo-500/40 border-indigo-300 text-white ring-2 ring-indigo-400'
                : 'bg-indigo-500/15 border-indigo-400/20 text-indigo-100 hover:bg-indigo-500/25'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
              <span>Izin (I)</span>
              <FileText className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="text-2xl font-black text-indigo-100 mt-1">
              {counts.permitted} <span className="text-xs font-normal opacity-80">Siswa</span>
            </div>
            <div className="text-[10px] text-indigo-200/80 mt-0.5">Izin resmi orang tua</div>
          </div>

          {/* Alpha */}
          <div
            onClick={() => setStatusFilter('ALPHA')}
            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
              statusFilter === 'ALPHA'
                ? 'bg-rose-500/40 border-rose-300 text-white ring-2 ring-rose-400'
                : 'bg-rose-500/15 border-rose-400/20 text-rose-100 hover:bg-rose-500/25'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-200">
              <span>Alpha (A)</span>
              <AlertOctagon className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-2xl font-black text-rose-100 mt-1">
              {counts.absent} <span className="text-xs font-normal opacity-80">Siswa</span>
            </div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Tanpa keterangan</div>
          </div>

          {/* Terlambat */}
          <div
            onClick={() => setStatusFilter('TERLAMBAT')}
            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
              statusFilter === 'TERLAMBAT'
                ? 'bg-orange-500/40 border-orange-300 text-white ring-2 ring-orange-400'
                : 'bg-orange-500/15 border-orange-400/20 text-orange-100 hover:bg-orange-500/25'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-orange-200">
              <span>Terlambat (T)</span>
              <Clock className="w-4 h-4 text-orange-300" />
            </div>
            <div className="text-2xl font-black text-orange-100 mt-1">
              {counts.late} <span className="text-xs font-normal opacity-80">Siswa</span>
            </div>
            <div className="text-[10px] text-orange-200/80 mt-0.5">Tercatat di Guru Piket</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Actions, Filters & Search */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        {/* Row 1: Action Tool Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL_ABSENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'ALL_ABSENT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tidak Hadir ({counts.totalAbsent})
            </button>
            <button
              onClick={() => setStatusFilter('SAKIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'SAKIT'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Sakit ({counts.sick})</span>
            </button>
            <button
              onClick={() => setStatusFilter('IZIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'IZIN'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              <span>Izin ({counts.permitted})</span>
            </button>
            <button
              onClick={() => setStatusFilter('ALPHA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'ALPHA'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              <span>Alpha ({counts.absent})</span>
            </button>
            <button
              onClick={() => setStatusFilter('TERLAMBAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'TERLAMBAT'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              <span>Terlambat ({counts.late})</span>
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({counts.totalStudents})
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                copiedSummary
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Salin rekapitulasi presensi harian untuk dikirim ke grup WhatsApp guru / kepala sekolah"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Tersalin ke Clipboard!' : 'Salin Format WA Piket'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Unduh laporan resmi PDF daftar siswa tidak hadir"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Ekspor ke spreadsheet Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {onNavigateToNotifications && counts.totalAbsent > 0 && (
              <button
                onClick={onNavigateToNotifications}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA Ortu ({counts.totalAbsent})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Search & Class Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama siswa, NISN, nama wali, atau alasan ketidakhadiran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Grade filter */}
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setClassFilter('ALL');
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="7">Kelas 7 (7A-7G)</option>
              <option value="8">Kelas 8 (8A-8G)</option>
              <option value="9">Kelas 9 (9A-9G)</option>
            </select>

            {/* Class filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua 21 Kelas</option>
              {classes
                .filter((c) => gradeFilter === 'ALL' || c.gradeLevel === gradeFilter)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Students List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Siswa & NISN</th>
                <th className="py-3.5 px-2 text-center w-12">L/P</th>
                <th className="py-3.5 px-4">Kelas & Wali</th>
                <th className="py-3.5 px-3 text-center">Status Presensi</th>
                <th className="py-3.5 px-4">Waktu / Alasan Keterangan</th>
                <th className="py-3.5 px-4">Orang Tua / Wali</th>
                <th className="py-3.5 px-3 text-center">Status Notif WA</th>
                <th className="py-3.5 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-sm">
                          {statusFilter === 'ALL_ABSENT'
                            ? 'Nihil / Seluruh Siswa Hadir Tertib!'
                            : `Tidak Ada Siswa Berstatus ${statusFilter}`}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {statusFilter === 'ALL_ABSENT'
                            ? `Tidak ada siswa yang tercatat Izin, Sakit, atau Alpha pada tanggal ${formatIndonesianDate(selectedDate)}.`
                            : 'Silakan ubah filter status atau kata kunci pencarian.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const status = item.record.status;
                  const isSent =
                    item.notification?.deliveryStatus === 'SENT' ||
                    item.notification?.deliveryStatus === 'CONFIRMED';

                  let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (status === 'SAKIT') statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                  else if (status === 'IZIN') statusBadgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
                  else if (status === 'ALPHA') statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
                  else if (status === 'TERLAMBAT') statusBadgeClass = 'bg-orange-50 text-orange-800 border-orange-300 font-bold';

                  return (
                    <tr
                      key={item.student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectStudentDetail(item.student)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{item.student.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NISN: {item.student.nisn}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.student.gender === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {item.student.gender}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          Kelas {item.className}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={item.homeroomTeacher}>
                          Wali: {item.homeroomTeacher.split(',')[0]}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] ${statusBadgeClass}`}
                        >
                          {status === 'SAKIT' && <HeartPulse className="w-3 h-3 text-amber-600" />}
                          {status === 'IZIN' && <FileText className="w-3 h-3 text-indigo-600" />}
                          {status === 'ALPHA' && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                          {status === 'TERLAMBAT' && <Clock className="w-3 h-3 text-orange-600" />}
                          {status === 'HADIR' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{getStatusBadgeText(status)}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {item.record.notes || <span className="text-slate-400 italic">Tanpa Keterangan Khusus</span>}
                        </div>
                        {item.record.time && item.record.time !== '-' && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.record.time} WIB</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.student.parentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.parentPhone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {status === 'HADIR' ? (
                          <span className="text-[11px] text-slate-400">-</span>
                        ) : isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terkirim</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Trigger */}
                          {status !== 'HADIR' && (
                            <button
                              onClick={() => handleOpenWhatsAppPreview(item)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Kirim / Preview Pesan WhatsApp ke Orang Tua"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Edit Status */}
                          {onUpdateAttendance && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Ubah Status / Catatan Keterangan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Detail Profile */}
                          <button
                            onClick={() => onSelectStudentDetail(item.student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Lihat Profil Siswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal: Quick Edit Status / Notes */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ubah Status Presensi Siswa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingItem.student.name} &bull; Kelas {editingItem.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Status Kehadiran ({formatIndonesianDate(selectedDate)})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('HADIR')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      editStatus === 'HADIR'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Hadir (H)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('SAKIT')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      editStatus === 'SAKIT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Sakit (S)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('IZIN')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      editStatus === 'IZIN'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    Izin (I)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('ALPHA')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      editStatus === 'ALPHA'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Alpha (A)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sakit demam tinggi, ada surat dokter"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Message Preview & Direct Send */}
      {whatsappPreviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Kirim Notifikasi WhatsApp Orang Tua
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kepada: {whatsappPreviewItem.student.parentName} ({whatsappPreviewItem.student.parentPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappPreviewItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Isi Format Pesan WhatsApp:
              </label>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto">
                {whatsappPreviewItem.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappPreviewItem.message);
                  setCopiedSingleMsg(true);
                  setTimeout(() => setCopiedSingleMsg(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                {copiedSingleMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSingleMsg ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsappPreviewItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendDirectWhatsApp(
                      whatsappPreviewItem.student.parentPhone,
                      whatsappPreviewItem.message
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
