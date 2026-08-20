import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Calendar,
  School,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClassRoom,
  SchoolProfile,
  Student,
  ParentNotification,
} from '../types';
import { exportAttendanceToPDF, exportAttendanceToExcel, formatIndonesianDate } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  notifications: ParentNotification[];
  selectedDate: string;
  schoolProfile: SchoolProfile;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  attendanceRecords,
  notifications,
  selectedDate,
  schoolProfile,
}) => {
  const [targetClassId, setTargetClassId] = useState<string>('ALL');
  const [exportDate, setExportDate] = useState<string>(selectedDate);
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const targetClass = classes.find((c) => c.id === targetClassId);

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportAttendanceToPDF({
        targetClass,
        students,
        records: attendanceRecords,
        date: exportDate,
        schoolProfile,
        allClasses: classes,
      });
      setIsExporting(false);
      setSuccessMsg('Laporan PDF berhasil diunduh!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 400);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportAttendanceToExcel({
        targetClass,
        students,
        records: attendanceRecords,
        date: exportDate,
        schoolProfile,
        notifications,
      });
      setIsExporting(false);
      setSuccessMsg('File Excel (.xlsx) berhasil diunduh!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Ekspor Laporan Presensi</h3>
              <p className="text-[11px] text-slate-500">Format resmi untuk Guru Piket & Wali Kelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Class Target */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Cakupan Kelas</label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
            >
              <option value="ALL">Seluruh Kelas ({students.length} Siswa)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} &bull; Wali: {cls.homeroomTeacher.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Tanggal Presensi</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer w-full"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Tanggal terpilih: <span className="font-semibold text-slate-700">{formatIndonesianDate(exportDate)}</span>
            </div>
          </div>

          {/* Preview Format Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <span className="block font-bold text-slate-700">Pilih Format Ekspor:</span>

            {/* PDF Option */}
            <div
              onClick={handleExportPDF}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-700">
                    Dokumen PDF Resmi
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Lengkap dengan Kop Surat Sekolah, Tabel Presensi, Rekapitulasi & Tanda Tangan
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>

            {/* Excel Option */}
            <div
              onClick={handleExportExcel}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">
                    Lembar Kerja Excel (.xlsx)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Format tabular siap olah data, terpisah Sheet Presensi & Sheet Statistik
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
