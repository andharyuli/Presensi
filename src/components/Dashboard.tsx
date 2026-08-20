import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  HeartPulse,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Send,
  FileText,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AttendanceRecord,
  ClassRoom,
  Student,
  SchoolProfile,
  ParentNotification,
} from '../types';
import { formatIndonesianDate, formatShortDate, exportAttendanceToPDF, exportAttendanceToExcel } from '../utils/exportUtils';

interface DashboardProps {
  students: Student[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  schoolProfile: SchoolProfile;
  onNavigateToRollcall: (classId?: string) => void;
  onNavigateToTodayAbsence?: () => void;
  onNavigateToNotifications: () => void;
  onOpenExportModal: () => void;
  onSelectStudentDetail: (student: Student) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  classes,
  attendanceRecords,
  notifications,
  selectedDate,
  setSelectedDate,
  schoolProfile,
  onNavigateToRollcall,
  onNavigateToTodayAbsence,
  onNavigateToNotifications,
  onOpenExportModal,
  onSelectStudentDetail,
}) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dashAbsenceStatusFilter, setDashAbsenceStatusFilter] = useState<'ALL_ABSENT' | 'SAKIT' | 'IZIN' | 'ALPHA'>('ALL_ABSENT');
  const [dashAbsenceSearch, setDashAbsenceSearch] = useState('');
  const [dashCopiedSummary, setDashCopiedSummary] = useState(false);

  // Stats for Selected Date
  const todayStats = useMemo(() => {
    const activeStudents = students.filter((s) => s.isActive);
    const total = activeStudents.length;

    let present = 0;
    let sick = 0;
    let permitted = 0;
    let absent = 0;
    let late = 0;

    activeStudents.forEach((st) => {
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

    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

    return {
      total,
      present,
      sick,
      permitted,
      absent,
      late,
      rate: Number(rate),
    };
  }, [students, attendanceRecords, selectedDate]);

  // Class by Class Breakdown for Selected Date
  const classBreakdowns = useMemo(() => {
    return classes.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id && s.isActive);
      const total = classStudents.length;
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

      const rate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

      return {
        id: cls.id,
        name: cls.name,
        teacher: cls.homeroomTeacher,
        total,
        present,
        sick,
        permitted,
        absent,
        late,
        rate,
      };
    });
  }, [classes, students, attendanceRecords, selectedDate]);

  // Trend Data Calculation for Charts
  const trendData = useMemo(() => {
    const days = timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 21 : 5;
    const result: Array<{
      date: string;
      label: string;
      hadir: number;
      sakit: number;
      izin: number;
      alpha: number;
      terlambat: number;
      persentase: number;
    }> = [];

    const activeTotal = students.filter((s) => s.isActive).length || 1;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      // Skip sundays
      if (dayOfWeek === 0) continue;

      const dateStr = d.toISOString().split('T')[0];

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpha = 0;
      let terlambat = 0;

      students.forEach((st) => {
        const rec = attendanceRecords.find((r) => r.studentId === st.id && r.date === dateStr);
        const status = rec ? rec.status : 'HADIR';
        if (status === 'HADIR') hadir++;
        else if (status === 'SAKIT') sakit++;
        else if (status === 'IZIN') izin++;
        else if (status === 'ALPHA') alpha++;
        else if (status === 'TERLAMBAT') {
          terlambat++;
          hadir++;
        }
      });

      const percentage = Number(((hadir / activeTotal) * 100).toFixed(1));

      result.push({
        date: dateStr,
        label: formatShortDate(dateStr),
        hadir,
        sakit,
        izin,
        alpha,
        terlambat,
        persentase: percentage,
      });
    }

    return result;
  }, [timeRange, selectedDate, students, attendanceRecords]);

  // Pie Chart Data
  const pieData = useMemo(() => {
    return [
      { name: 'Hadir Tepat Waktu', value: todayStats.present - todayStats.late, color: '#2563eb' },
      { name: 'Terlambat', value: todayStats.late, color: '#f59e0b' },
      { name: 'Sakit', value: todayStats.sick, color: '#f97316' },
      { name: 'Izin', value: todayStats.permitted, color: '#6366f1' },
      { name: 'Alpha', value: todayStats.absent, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [todayStats]);

  // Students Needing Attention (Highest Absences)
  const studentsNeedingAttention = useMemo(() => {
    const studentAbsenceMap = new Map<string, { sick: number; permitted: number; absent: number; totalAbsence: number }>();

    attendanceRecords.forEach((rec) => {
      if (rec.status !== 'HADIR') {
        const current = studentAbsenceMap.get(rec.studentId) || { sick: 0, permitted: 0, absent: 0, totalAbsence: 0 };
        if (rec.status === 'SAKIT') current.sick++;
        else if (rec.status === 'IZIN') current.permitted++;
        else if (rec.status === 'ALPHA') current.absent++;
        current.totalAbsence++;
        studentAbsenceMap.set(rec.studentId, current);
      }
    });

    const list = students
      .map((st) => {
        const counts = studentAbsenceMap.get(st.id) || { sick: 0, permitted: 0, absent: 0, totalAbsence: 0 };
        const cls = classes.find((c) => c.id === st.classId);
        return {
          student: st,
          className: cls ? cls.name : '-',
          ...counts,
        };
      })
      .filter((item) => item.totalAbsence > 0)
      .sort((a, b) => b.absent * 3 + b.totalAbsence - (a.absent * 3 + a.totalAbsence))
      .slice(0, 5);

    return list;
  }, [students, attendanceRecords, classes]);

  // Absent Students Today for Quick Notification Widget
  const absentStudentsToday = useMemo(() => {
    return students
      .map((st) => {
        const rec = attendanceRecords.find((r) => r.studentId === st.id && r.date === selectedDate);
        if (rec && (rec.status === 'SAKIT' || rec.status === 'IZIN' || rec.status === 'ALPHA')) {
          const notif = notifications.find((n) => n.studentId === st.id && n.date === selectedDate);
          const cls = classes.find((c) => c.id === st.classId);
          return {
            student: st,
            className: cls?.name || '-',
            record: rec,
            notification: notif,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{
        student: Student;
        className: string;
        record: AttendanceRecord;
        notification?: ParentNotification;
      }>;
  }, [students, attendanceRecords, notifications, selectedDate, classes]);

  const pendingNotifsCount = absentStudentsToday.filter(
    (item) => !item.notification || item.notification.deliveryStatus === 'PENDING'
  ).length;

  // Filtered absent students for dashboard list
  const filteredDashboardAbsences = useMemo(() => {
    return absentStudentsToday.filter((item) => {
      if (dashAbsenceStatusFilter !== 'ALL_ABSENT' && item.record.status !== dashAbsenceStatusFilter) {
        return false;
      }
      if (dashAbsenceSearch.trim()) {
        const q = dashAbsenceSearch.toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(q);
        const matchNisn = item.student.nisn.includes(q);
        const matchClass = item.className.toLowerCase().includes(q);
        const matchNote = (item.record.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchClass && !matchNote) return false;
      }
      return true;
    });
  }, [absentStudentsToday, dashAbsenceStatusFilter, dashAbsenceSearch]);

  const handleDashCopySummary = () => {
    const dateFormatted = formatIndonesianDate(selectedDate);
    let text = `📢 *REKAPITULASI PRESENSI HARIAN SISWA*\n`;
    text += `🏫 *${schoolProfile.name}*\n`;
    text += `📅 Tanggal: ${dateFormatted}\n`;
    text += `👨‍🏫 Guru Piket: ${schoolProfile.dutyTeacherToday}\n`;
    text += `──────────────────────\n`;
    text += `📊 *RINGKASAN STATUS KETIDAKHADIRAN:*\n`;
    text += `• Sakit (S): ${todayStats.sick} siswa\n`;
    text += `• Izin (I): ${todayStats.permitted} siswa\n`;
    text += `• Alpha (A): ${todayStats.absent} siswa\n`;
    text += `• Total Tidak Hadir: ${absentStudentsToday.length} siswa\n`;
    text += `──────────────────────\n\n`;

    if (absentStudentsToday.length === 0) {
      text += `✅ *Alhamdulillah, NIHIL / Seluruh siswa hadir tertib hari ini.*\n`;
    } else {
      text += `📋 *DAFTAR SISWA TIDAK HADIR:*\n`;
      absentStudentsToday.forEach((it, idx) => {
        const statusLabel =
          it.record.status === 'SAKIT'
            ? '[SAKIT]'
            : it.record.status === 'IZIN'
            ? '[IZIN]'
            : '[ALPHA]';
        const note = it.record.notes ? ` (${it.record.notes})` : '';
        text += `${idx + 1}. ${it.student.name} (Kelas ${it.className}) - ${statusLabel}${note}\n`;
      });
    }

    text += `\n──────────────────────\n`;
    text += `_Laporan otomatis Sistem Presensi Digital ${schoolProfile.name}_\n`;

    navigator.clipboard.writeText(text);
    setDashCopiedSummary(true);
    setTimeout(() => setDashCopiedSummary(false), 2500);
  };

  const handleDirectWA = (phone: string, studentName: string, className: string, status: string, notes?: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const dateFormatted = formatIndonesianDate(selectedDate);
    const msg = `Yth. Bapak/Ibu Wali Murid dari ${studentName} (Kelas ${className}),\n\nKami dari pihak sekolah ${schoolProfile.name} menginformasikan bahwa pada hari ini, ${dateFormatted}, presensi ananda tercatat: *${status.toUpperCase()}* ${notes ? `(${notes})` : ''}.\n\nJika ada kekeliruan atau keperluan konfirmasi lebih lanjut, mohon dapat menghubungi Wali Kelas atau Guru Piket.\n\nTerima kasih atas perhatian dan kerjasamanya.\n\n_Hormat kami,_\n*${schoolProfile.name}*`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-50 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Pusat Kendali Presensi & Monitoring Kesiswaan</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Ringkasan Kehadiran &mdash; {formatIndonesianDate(selectedDate)}
          </h2>
          <p className="text-blue-100 text-sm max-w-2xl">
            Pantau statistik tingkat kehadiran, kelola rekapitulasi harian per kelas, dan kirimkan pemberitahuan otomatis kepada wali murid.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToTodayAbsence && (
            <button
              id="dash-btn-today-absence"
              onClick={onNavigateToTodayAbsence}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors"
            >
              <HeartPulse className="w-4 h-4 text-white" />
              <span>Daftar Izin, Sakit, Alpha ({absentStudentsToday.length})</span>
            </button>
          )}

          <button
            id="dash-btn-rollcall"
            onClick={() => onNavigateToRollcall()}
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Input Presensi Hari Ini</span>
          </button>

          <button
            id="dash-btn-notifications"
            onClick={onNavigateToNotifications}
            className="flex items-center gap-2 bg-blue-800/80 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm border border-white/20 shadow-xs transition-colors"
          >
            <Send className="w-4 h-4 text-blue-200" />
            <span>Kirim Notifikasi ({absentStudentsToday.length})</span>
          </button>

          <button
            id="dash-btn-export-quick"
            onClick={onOpenExportModal}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl font-semibold text-sm border border-white/20 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Siswa</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {todayStats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Terdaftar di {classes.length} Kelas
          </div>
        </div>

        {/* Tingkat Kehadiran % */}
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/60 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kehadiran</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 tracking-tight">
            {todayStats.rate}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{todayStats.present} Siswa Hadir</span>
          </div>
        </div>

        {/* Sakit */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sakit (S)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
            {todayStats.sick}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            Surat dokter & konfirmasi
          </div>
        </div>

        {/* Izin */}
        <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Izin (I)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 tracking-tight">
            {todayStats.permitted}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            Izin orang tua / wali
          </div>
        </div>

        {/* Alpha */}
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Alpha (A)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
            {todayStats.absent}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">
            Perlu tindak lanjut WA
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-4 rounded-xl border border-orange-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-orange-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Terlambat (T)</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-orange-700 tracking-tight">
            {todayStats.late}
          </div>
          <div className="text-[11px] text-orange-600 mt-1 font-medium">
            Tercatat di Guru Piket
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Line / Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Tren Tingkat Kehadiran Siswa</span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi persentase kehadiran dan dinamika absensi harian
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                id="range-daily"
                onClick={() => setTimeRange('daily')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeRange === 'daily'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                5 Hari
              </button>
              <button
                id="range-weekly"
                onClick={() => setTimeRange('weekly')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeRange === 'weekly'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mingguan
              </button>
              <button
                id="range-monthly"
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeRange === 'monthly'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan (3 Pekan)
              </button>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPersentase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[60, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                  formatter={(val: number | string | undefined, name: string | undefined) => {
                    const numericVal = typeof val === 'number' ? val : Number(val) || 0;
                    if (name === 'persentase') return [`${numericVal}%`, 'Tingkat Kehadiran'];
                    if (name === 'hadir') return [`${numericVal} Siswa`, 'Hadir'];
                    if (name === 'sakit') return [`${numericVal} Siswa`, 'Sakit'];
                    if (name === 'izin') return [`${numericVal} Siswa`, 'Izin'];
                    if (name === 'alpha') return [`${numericVal} Siswa`, 'Alpha'];
                    return [numericVal, name || ''];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => {
                    if (value === 'persentase') return 'Tingkat Kehadiran (%)';
                    if (value === 'sakit') return 'Sakit (S)';
                    if (value === 'izin') return 'Izin (I)';
                    if (value === 'alpha') return 'Alpha (A)';
                    return value;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="persentase"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPersentase)"
                />
                <Area
                  type="monotone"
                  dataKey="alpha"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <span>Komposisi Status Hari Ini</span>
            </h3>
            <p className="text-xs text-slate-500">
              Distribusi status kehadiran seluruh siswa ({formatIndonesianDate(selectedDate)})
            </p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${value ?? 0} Siswa`,
                    'Jumlah',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Today's Absence List Card (Izin, Sakit, Alpha) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Daftar Siswa Tidak Hadir Hari Ini</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                    {absentStudentsToday.length} Siswa
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Data siswa yang berstatus Sakit, Izin, atau Alpha pada {formatIndonesianDate(selectedDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setDashAbsenceStatusFilter('ALL_ABSENT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  dashAbsenceStatusFilter === 'ALL_ABSENT'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({absentStudentsToday.length})
              </button>
              <button
                onClick={() => setDashAbsenceStatusFilter('SAKIT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  dashAbsenceStatusFilter === 'SAKIT'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Sakit ({todayStats.sick})
              </button>
              <button
                onClick={() => setDashAbsenceStatusFilter('IZIN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  dashAbsenceStatusFilter === 'IZIN'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                Izin ({todayStats.permitted})
              </button>
              <button
                onClick={() => setDashAbsenceStatusFilter('ALPHA')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  dashAbsenceStatusFilter === 'ALPHA'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Alpha ({todayStats.absent})
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleDashCopySummary}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dashCopiedSummary
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Salin ringkasan presensi harian untuk grup WA Guru/Piket"
            >
              {dashCopiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{dashCopiedSummary ? 'Tersalin!' : 'Salin Rekap WA'}</span>
            </button>

            {/* Expand Full View Button */}
            {onNavigateToTodayAbsence && (
              <button
                onClick={onNavigateToTodayAbsence}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <span>Buka Panel Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Filter for Dashboard Table */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Saring nama siswa, NISN, kelas, atau keterangan..."
              value={dashAbsenceSearch}
              onChange={(e) => setDashAbsenceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-4">Nama Siswa & NISN</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4">Keterangan / Alasan</th>
                <th className="py-2.5 px-4">Wali Murid & Kontak</th>
                <th className="py-2.5 px-3 text-center">Notifikasi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDashboardAbsences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2 px-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-90" />
                      <p className="font-bold text-slate-800 text-xs">
                        {dashAbsenceStatusFilter === 'ALL_ABSENT'
                          ? 'Tidak Ada Siswa yang Absen Hari Ini (Nihil)'
                          : `Tidak Ada Siswa yang ${dashAbsenceStatusFilter}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {dashAbsenceStatusFilter === 'ALL_ABSENT'
                          ? `Seluruh siswa tercatat hadir tertib pada ${formatIndonesianDate(selectedDate)}.`
                          : 'Coba ubah filter status atau kata kunci pencarian.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDashboardAbsences.map((item, idx) => {
                  const status = item.record.status;
                  const isSent = item.notification?.deliveryStatus === 'SENT' || item.notification?.deliveryStatus === 'CONFIRMED';
                  
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (status === 'SAKIT') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                  else if (status === 'IZIN') badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
                  else if (status === 'ALPHA') badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';

                  return (
                    <tr key={item.student.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-2.5 px-4">
                        <div
                          onClick={() => onSelectStudentDetail(item.student)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {item.student.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">NISN: {item.student.nisn}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">Kelas {item.className}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] ${badgeStyle}`}>
                          {status === 'SAKIT' && <HeartPulse className="w-3 h-3 text-amber-600" />}
                          {status === 'IZIN' && <FileText className="w-3 h-3 text-indigo-600" />}
                          {status === 'ALPHA' && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                          <span>{status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-700 font-medium">{item.record.notes || <span className="text-slate-400 italic">Tanpa Keterangan</span>}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{item.student.parentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.student.parentPhone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isSent ? (
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
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              handleDirectWA(
                                item.student.parentPhone,
                                item.student.name,
                                item.className,
                                status,
                                item.record.notes
                              )
                            }
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Kirim Pesan WhatsApp ke Orang Tua"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStudentDetail(item.student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Lihat Profil Siswa"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Class Comparison Bar Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Perbandingan Kehadiran Antar Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Tingkat kehadiran (%) dan jumlah ketidakhadiran pada masing-masing kelas
              </p>
            </div>
            <button
              onClick={() => onNavigateToRollcall()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Detail Semua Kelas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBreakdowns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(val: number | string | undefined, name: string | undefined) => {
                    const numericVal = typeof val === 'number' ? val : Number(val) || 0;
                    if (name === 'rate') return [`${numericVal}%`, 'Tingkat Kehadiran'];
                    if (name === 'sick') return [`${numericVal} Siswa`, 'Sakit'];
                    if (name === 'permitted') return [`${numericVal} Siswa`, 'Izin'];
                    if (name === 'absent') return [`${numericVal} Siswa`, 'Alpha'];
                    return [numericVal, name || ''];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(v) => (v === 'rate' ? 'Kehadiran (%)' : v === 'sick' ? 'Sakit' : v === 'absent' ? 'Alpha' : v)}
                />
                <Bar dataKey="rate" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Class Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {classBreakdowns.map((cls) => (
              <div
                key={cls.id}
                onClick={() => onNavigateToRollcall(cls.id)}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">
                    {cls.name}
                  </span>
                  <span className={`text-xs font-extrabold ${cls.rate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cls.rate}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  Wali: {cls.teacher.split(',')[0]}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200/60 font-medium">
                  <span className="text-blue-700 font-bold">{cls.present} Hadir</span>
                  <span>&bull;</span>
                  <span className="text-amber-600">{cls.sick} S</span>
                  <span>&bull;</span>
                  <span className="text-indigo-600">{cls.permitted} I</span>
                  <span>&bull;</span>
                  <span className="text-rose-600 font-semibold">{cls.absent} A</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Pending Parent Notifications & Early Warning (1 col) */}
        <div className="space-y-6">
          {/* Pending Notifications Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Notifikasi Orang Tua Hari Ini
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                {absentStudentsToday.length} Siswa Absen
              </span>
            </div>

            {absentStudentsToday.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <p className="font-semibold text-slate-700">Luar Biasa!</p>
                <p>Seluruh siswa tercatat hadir hari ini.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {absentStudentsToday.slice(0, 4).map((item, idx) => {
                  const statusColor =
                    item.record.status === 'SAKIT'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : item.record.status === 'IZIN'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  const isSent = item.notification?.deliveryStatus === 'SENT' || item.notification?.deliveryStatus === 'CONFIRMED';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 truncate">
                            {item.student.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({item.className})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.2 font-bold rounded border ${statusColor}`}>
                            {item.record.status}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {item.record.notes || 'Tanpa Keterangan'}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terkirim</span>
                          </span>
                        ) : (
                          <button
                            onClick={onNavigateToNotifications}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim WA</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {absentStudentsToday.length > 0 && (
              <button
                onClick={onNavigateToNotifications}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Buka Panel Notifikasi Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Early Warning / Student Follow-up */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Perlu Perhatian Kesiswaan
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Akumulasi Absensi
              </span>
            </div>

            <div className="space-y-2">
              {studentsNeedingAttention.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectStudentDetail(item.student)}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {item.student.name}
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      {item.totalAbsence}x Absen
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Kelas {item.className}</span>
                    <span className="text-slate-600 font-medium">
                      Sakit: {item.sick} | Izin: {item.permitted} | Alpha: <strong className="text-rose-600">{item.absent}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
