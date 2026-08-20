import React from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  CheckCircle2,
  HeartPulse,
  FileText,
  AlertOctagon,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClassRoom,
  SchoolProfile,
  Student,
} from '../types';
import { formatIndonesianDate, formatShortDate, getStatusBadgeText } from '../utils/exportUtils';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  schoolProfile: SchoolProfile;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  classes,
  attendanceRecords,
  schoolProfile,
}) => {
  if (!student) return null;

  const currentClass = classes.find((c) => c.id === student.classId);

  // Student's records sorted by date desc
  const studentRecords = attendanceRecords
    .filter((r) => r.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Compute stats
  let present = 0;
  let sick = 0;
  let permitted = 0;
  let absent = 0;

  studentRecords.forEach((r) => {
    if (r.status === 'HADIR' || (r.status as string) === 'TERLAMBAT') present++;
    else if (r.status === 'SAKIT') sick++;
    else if (r.status === 'IZIN') permitted++;
    else if (r.status === 'ALPHA') absent++;
  });

  const total = studentRecords.length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '100';

  const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Yth. Bapak/Ibu Wali Murid dari ${student.name} (Kelas ${currentClass?.name}),\n\nKami dari pihak sekolah ${schoolProfile.name} ingin mengonfirmasi perkembangan kehadiran ananda.\n\nTerima kasih.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xl shadow-inner border border-white/20">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{student.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  {student.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-blue-100 text-xs mt-0.5">
                NISN: <span className="font-mono font-bold text-white">{student.nisn}</span> &bull; Kelas: <span className="font-bold text-white">{currentClass?.name}</span> ({currentClass?.roomNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Tingkat Hadir</span>
              <div className="text-xl font-extrabold text-blue-800 mt-0.5">{rate}%</div>
            </div>
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Hadir</span>
              <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{present} Hari</div>
            </div>
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Sakit (S)</span>
              <div className="text-xl font-extrabold text-amber-800 mt-0.5">{sick}x</div>
            </div>
            <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Izin (I)</span>
              <div className="text-xl font-extrabold text-indigo-800 mt-0.5">{permitted}x</div>
            </div>
            <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Alpha (A)</span>
              <div className="text-xl font-extrabold text-rose-800 mt-0.5">{absent}x</div>
            </div>
          </div>

          {/* Contact & Parent Info Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs">Informasi Orang Tua / Wali</h4>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Wali: <strong>{student.parentName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>No. WhatsApp: <strong className="font-mono">{student.parentPhone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Alamat: {student.address}</span>
              </div>
            </div>
          </div>

          {/* Attendance History List */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Riwayat Presensi Harian Siswa</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {studentRecords.length} Catatan Presensi
              </span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Waktu</th>
                    <th className="py-2.5 px-3">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {studentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        Belum ada catatan presensi.
                      </td>
                    </tr>
                  ) : (
                    studentRecords.map((r, idx) => {
                      const statusColor =
                        r.status === 'HADIR'
                          ? 'bg-blue-50 text-blue-700'
                          : r.status === 'SAKIT'
                          ? 'bg-amber-50 text-amber-700'
                          : r.status === 'IZIN'
                          ? 'bg-indigo-50 text-indigo-700'
                          : r.status === 'ALPHA'
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : 'bg-orange-50 text-orange-700';

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium">
                            {formatShortDate(r.date)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                              {getStatusBadgeText(r.status)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                            {r.time}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {r.notes || '-'}
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
