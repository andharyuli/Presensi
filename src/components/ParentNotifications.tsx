import React, { useState, useMemo } from 'react';
import {
  BellRing,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Copy,
  ExternalLink,
  Settings,
  Sparkles,
  Search,
  Filter,
  Check,
  RefreshCw,
  FileCheck,
  UserCheck,
  Phone,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassRoom,
  ParentNotification,
  SchoolProfile,
  Student,
} from '../types';
import { formatIndonesianDate } from '../utils/exportUtils';
import { defaultNotificationTemplates } from '../data/initialData';

interface ParentNotificationsProps {
  students: Student[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schoolProfile: SchoolProfile;
  templates: typeof defaultNotificationTemplates;
  onSaveTemplates: (templates: typeof defaultNotificationTemplates) => void;
  onUpdateNotification: (notif: ParentNotification) => void;
  onAddNotification: (notif: ParentNotification) => void;
  onBatchSendNotifications: (notifs: ParentNotification[]) => void;
}

export const ParentNotifications: React.FC<ParentNotificationsProps> = ({
  students,
  classes,
  attendanceRecords,
  notifications,
  selectedDate,
  setSelectedDate,
  schoolProfile,
  templates,
  onSaveTemplates,
  onUpdateNotification,
  onAddNotification,
  onBatchSendNotifications,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'templates' | 'logs'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template editing state
  const [editingTemplates, setEditingTemplates] = useState(templates);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // 1. Identify all absent students today
  const absentStudentsToday = useMemo(() => {
    return students
      .map((st) => {
        const rec = attendanceRecords.find(
          (r) => r.studentId === st.id && r.date === selectedDate
        );
        if (rec && (rec.status === 'SAKIT' || rec.status === 'IZIN' || rec.status === 'ALPHA')) {
          const cls = classes.find((c) => c.id === st.classId);
          const existingNotif = notifications.find(
            (n) => n.studentId === st.id && n.date === selectedDate
          );
          return {
            student: st,
            className: cls?.name || '-',
            homeroomTeacher: cls?.homeroomTeacher || 'Wali Kelas',
            record: rec,
            notification: existingNotif,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{
        student: Student;
        className: string;
        homeroomTeacher: string;
        record: AttendanceRecord;
        notification?: ParentNotification;
      }>;
  }, [students, attendanceRecords, selectedDate, classes, notifications]);

  // Generate populated template message
  const generateMessageText = (
    student: Student,
    className: string,
    homeroomTeacher: string,
    status: AttendanceStatus,
    notes?: string,
    time?: string
  ) => {
    let rawTemplate = templates[status as keyof typeof templates] || templates.SAKIT;
    return rawTemplate
      .replace(/{NAMA_SISWA}/g, student.name)
      .replace(/{NAMA_KELAS}/g, className)
      .replace(/{TANGGAL}/g, formatIndonesianDate(selectedDate))
      .replace(/{KETERANGAN}/g, notes || 'Belum ada keterangan')
      .replace(/{WAKTU}/g, time || '07:00 WIB')
      .replace(/{WALI_KELAS}/g, homeroomTeacher)
      .replace(/{NAMA_SEKOLAH}/g, schoolProfile.name);
  };

  // Filtered Queue
  const filteredAbsentList = useMemo(() => {
    return absentStudentsToday.filter((item) => {
      const matchSearch =
        item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.parentPhone.includes(searchQuery);

      if (!matchSearch) return false;

      if (filterClass !== 'ALL' && item.student.classId !== filterClass) return false;

      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'PENDING') {
        return !item.notification || item.notification.deliveryStatus === 'PENDING';
      }
      if (filterStatus === 'SENT') {
        return item.notification?.deliveryStatus === 'SENT';
      }
      if (filterStatus === 'CONFIRMED') {
        return item.notification?.deliveryStatus === 'CONFIRMED';
      }
      return true;
    });
  }, [absentStudentsToday, searchQuery, filterClass, filterStatus]);

  // Broadcast / Auto send all pending notifications
  const handleBroadcastAll = () => {
    setIsBroadcasting(true);

    setTimeout(() => {
      const newNotifications: ParentNotification[] = [];

      absentStudentsToday.forEach((item) => {
        const message = generateMessageText(
          item.student,
          item.className,
          item.homeroomTeacher,
          item.record.status,
          item.record.notes,
          item.record.time
        );

        const notif: ParentNotification = {
          id: item.notification?.id || `notif-${item.student.id}-${selectedDate}`,
          studentId: item.student.id,
          studentName: item.student.name,
          className: item.className,
          parentName: item.student.parentName,
          parentPhone: item.student.parentPhone,
          date: selectedDate,
          status: item.record.status,
          notes: item.record.notes,
          message,
          channel: 'WHATSAPP',
          deliveryStatus: 'SENT',
          sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        };

        newNotifications.push(notif);
      });

      onBatchSendNotifications(newNotifications);
      setIsBroadcasting(false);
    }, 800);
  };

  const handleSendSingleWA = (item: typeof absentStudentsToday[0]) => {
    const message = generateMessageText(
      item.student,
      item.className,
      item.homeroomTeacher,
      item.record.status,
      item.record.notes,
      item.record.time
    );

    const updatedNotif: ParentNotification = {
      id: item.notification?.id || `notif-${item.student.id}-${selectedDate}`,
      studentId: item.student.id,
      studentName: item.student.name,
      className: item.className,
      parentName: item.student.parentName,
      parentPhone: item.student.parentPhone,
      date: selectedDate,
      status: item.record.status,
      notes: item.record.notes,
      message,
      channel: 'WHATSAPP',
      deliveryStatus: 'SENT',
      sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    onAddNotification(updatedNotif);

    // Open WhatsApp Web Link
    const cleanPhone = item.student.parentPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleMarkConfirmed = (item: typeof absentStudentsToday[0]) => {
    const message = generateMessageText(
      item.student,
      item.className,
      item.homeroomTeacher,
      item.record.status,
      item.record.notes,
      item.record.time
    );

    const updatedNotif: ParentNotification = {
      id: item.notification?.id || `notif-${item.student.id}-${selectedDate}`,
      studentId: item.student.id,
      studentName: item.student.name,
      className: item.className,
      parentName: item.student.parentName,
      parentPhone: item.student.parentPhone,
      date: selectedDate,
      status: item.record.status,
      notes: item.record.notes,
      message,
      channel: 'WHATSAPP',
      deliveryStatus: 'CONFIRMED',
      sentAt: item.notification?.sentAt || '07:30 WIB',
      confirmedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      parentReply: 'Wali murid telah mengonfirmasi ketidakhadiran ananda.',
      confirmationMethod: 'WA_CHAT',
    };

    onAddNotification(updatedNotif);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTemplates(editingTemplates);
    setTemplateSavedMsg(true);
    setTimeout(() => setTemplateSavedMsg(false), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const totalAbsent = absentStudentsToday.length;
    let sent = 0;
    let confirmed = 0;
    let pending = 0;

    absentStudentsToday.forEach((item) => {
      if (!item.notification || item.notification.deliveryStatus === 'PENDING') {
        pending++;
      } else if (item.notification.deliveryStatus === 'SENT') {
        sent++;
      } else if (item.notification.deliveryStatus === 'CONFIRMED') {
        confirmed++;
      }
    });

    return { totalAbsent, sent, confirmed, pending };
  }, [absentStudentsToday]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <BellRing className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Sistem Notifikasi Otomatis Orang Tua / Wali
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pemberitahuan resmi otomatis via WhatsApp & SMS untuk siswa yang Sakit, Izin, atau Alpha pada {formatIndonesianDate(selectedDate)}
              </p>
            </div>
          </div>

          {/* Broadcast Auto Button */}
          <div className="flex items-center gap-2.5">
            <button
              id="notif-broadcast-btn"
              onClick={handleBroadcastAll}
              disabled={isBroadcasting || absentStudentsToday.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isBroadcasting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-200" />
              )}
              <span>
                {isBroadcasting
                  ? 'Sedang Memproses Notifikasi...'
                  : `Kirim Notifikasi Otomatis (${absentStudentsToday.length} Siswa)`}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Total Siswa Tidak Hadir</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalAbsent} Siswa</div>
          </div>
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
            <span className="text-amber-700 font-medium">Menunggu Pengiriman</span>
            <div className="text-xl font-bold text-amber-800 mt-0.5">{stats.pending} Siswa</div>
          </div>
          <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200">
            <span className="text-blue-700 font-medium">Terkirim ke WhatsApp</span>
            <div className="text-xl font-bold text-blue-800 mt-0.5">{stats.sent} Pesan</div>
          </div>
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 font-medium">Dikonfirmasi Orang Tua</span>
            <div className="text-xl font-bold text-emerald-800 mt-0.5">{stats.confirmed} Wali Murid</div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'queue'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Antrean Notifikasi Hari Ini ({absentStudentsToday.length})
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'templates'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan Template Pesan</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: QUEUE NOTIFICATIONS */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama siswa, nama orang tua, atau no WA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Status Notif</option>
                <option value="PENDING">Menunggu Kirim</option>
                <option value="SENT">Terkirim</option>
                <option value="CONFIRMED">Dikonfirmasi Ortu</option>
              </select>
            </div>
          </div>

          {/* Notification Cards Grid */}
          {filteredAbsentList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Antrean Notifikasi</h3>
              <p className="text-xs">
                Seluruh siswa hadir atau tidak ada data yang cocok dengan kriteria filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAbsentList.map((item) => {
                const messageText = generateMessageText(
                  item.student,
                  item.className,
                  item.homeroomTeacher,
                  item.record.status,
                  item.record.notes,
                  item.record.time
                );

                const statusColor =
                  item.record.status === 'SAKIT'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : item.record.status === 'IZIN'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                const isConfirmed = item.notification?.deliveryStatus === 'CONFIRMED';
                const isSent = item.notification?.deliveryStatus === 'SENT';

                return (
                  <div
                    key={item.student.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-blue-300 transition-all"
                  >
                    {/* Header: Student, Class, Reason */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {item.student.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.className}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Wali: <strong>{item.student.parentName}</strong></span>
                          <span>&bull;</span>
                          <span className="font-mono text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.student.parentPhone}
                          </span>
                        </div>
                      </div>

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusColor}`}>
                        {item.record.status}
                      </span>
                    </div>

                    {/* Notes */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                      <span className="font-semibold text-slate-500">Catatan Piket:</span>{' '}
                      <span className="text-slate-800 font-medium">
                        {item.record.notes || 'Tanpa keterangan resmi'}
                      </span>
                    </div>

                    {/* Pre-formatted Message Preview */}
                    <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                      {messageText}
                    </div>

                    {/* Delivery & Confirmation Info if any */}
                    {item.notification && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          Status:{' '}
                          <strong className={isConfirmed ? 'text-emerald-600' : 'text-blue-600'}>
                            {item.notification.deliveryStatus}
                          </strong>{' '}
                          {item.notification.sentAt && `(${item.notification.sentAt})`}
                        </span>
                        {item.notification.confirmedAt && (
                          <span className="text-emerald-600 font-medium">
                            Dikonfirmasi {item.notification.confirmedAt}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleSendSingleWA(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim via WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleCopyMessage(item.student.id, messageText)}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                        title="Salin Teks Pesan"
                      >
                        {copiedId === item.student.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {copiedId === item.student.id ? 'Tersalin' : 'Salin'}
                        </span>
                      </button>

                      {!isConfirmed && (
                        <button
                          onClick={() => handleMarkConfirmed(item)}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                          title="Tandai bahwa orang tua sudah mengonfirmasi"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Konfirmasi</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: TEMPLATE SETTINGS */}
      {activeSubTab === 'templates' && (
        <form onSubmit={handleSaveTemplatesSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Kustomisasi Format Pesan Notifikasi Otomatis
            </h3>
            <p className="text-xs text-slate-500">
              Gunakan tag otomatis seperti: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;NAMA_SISWA&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;NAMA_KELAS&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;TANGGAL&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;KETERANGAN&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;WALI_KELAS&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">&#123;NAMA_SEKOLAH&#125;</code>.
            </p>
          </div>

          {/* Sakit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Template Pesan: Siswa SAKIT (S)
            </label>
            <textarea
              rows={4}
              value={editingTemplates.SAKIT}
              onChange={(e) => setEditingTemplates({ ...editingTemplates, SAKIT: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Izin */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Template Pesan: Siswa IZIN (I)
            </label>
            <textarea
              rows={4}
              value={editingTemplates.IZIN}
              onChange={(e) => setEditingTemplates({ ...editingTemplates, IZIN: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Alpha */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Template Pesan: Siswa ALPHA / Tanpa Keterangan (A)
            </label>
            <textarea
              rows={4}
              value={editingTemplates.ALPHA}
              onChange={(e) => setEditingTemplates({ ...editingTemplates, ALPHA: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {templateSavedMsg && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Template berhasil disimpan!</span>
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Simpan Perubahan Template
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
