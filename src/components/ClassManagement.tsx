import React, { useState, useMemo } from 'react';
import {
  School,
  Users,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  ClipboardCheck,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  ClassRoom,
  SchoolProfile,
  Student,
} from '../types';
import { exportAttendanceToPDF, exportAttendanceToExcel } from '../utils/exportUtils';

interface ClassManagementProps {
  classes: ClassRoom[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  schoolProfile: SchoolProfile;
  onAddClass: (newClass: ClassRoom) => void;
  onUpdateClass: (updatedClass: ClassRoom) => void;
  onDeleteClass: (classId: string) => void;
  onNavigateToRollcall: (classId: string) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  students,
  attendanceRecords,
  selectedDate,
  schoolProfile,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onNavigateToRollcall,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<ClassRoom, 'id'>>({
    name: '',
    gradeLevel: 'X',
    major: 'MIPA',
    homeroomTeacher: '',
    homeroomNIP: '',
    roomNumber: '',
    academicYear: '2025/2026',
    capacity: 36,
  });

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      gradeLevel: 'X',
      major: 'MIPA',
      homeroomTeacher: '',
      homeroomNIP: '',
      roomNumber: 'R. 101',
      academicYear: schoolProfile.academicYear,
      capacity: 36,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      major: cls.major || 'MIPA',
      homeroomTeacher: cls.homeroomTeacher,
      homeroomNIP: cls.homeroomNIP,
      roomNumber: cls.roomNumber,
      academicYear: cls.academicYear,
      capacity: cls.capacity || 36,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      onUpdateClass({
        ...formData,
        id: editingClass.id,
      });
    } else {
      const newId = `cls-${formData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      onAddClass({
        ...formData,
        id: newId,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Daftar & Manajemen Kelas
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Kelola ruang kelas, penugasan wali kelas, dan pantau rekapitulasi kehadiran per kelas
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id && s.isActive);
          const maleCount = classStudents.filter((s) => s.gender === 'L').length;
          const femaleCount = classStudents.filter((s) => s.gender === 'P').length;

          // Attendance calculation for today
          let presentCount = 0;
          let sickCount = 0;
          let permittedCount = 0;
          let absentCount = 0;

          classStudents.forEach((st) => {
            const rec = attendanceRecords.find(
              (r) => r.studentId === st.id && r.date === selectedDate
            );
            const status = rec ? rec.status : 'HADIR';
            if (status === 'HADIR' || status === 'TERLAMBAT') presentCount++;
            else if (status === 'SAKIT') sickCount++;
            else if (status === 'IZIN') permittedCount++;
            else if (status === 'ALPHA') absentCount++;
          });

          const rate =
            classStudents.length > 0
              ? ((presentCount / classStudents.length) * 100).toFixed(1)
              : '0';

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all p-5 flex flex-col justify-between space-y-4 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                      Tingkat {cls.gradeLevel}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                      {cls.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ruang: <strong className="text-slate-700">{cls.roomNumber}</strong> &bull; TA {cls.academicYear}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cls)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="Edit Kelas"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {classes.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus kelas ${cls.name}?`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Wali Kelas */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs space-y-0.5">
                <div className="text-slate-400 font-medium">Wali Kelas:</div>
                <div className="font-bold text-slate-800">{cls.homeroomTeacher}</div>
                <div className="text-[11px] text-slate-500 font-mono">NIP. {cls.homeroomNIP}</div>
              </div>

              {/* Student Demographics & Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                  <span className="text-slate-500">Jumlah Siswa:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {classStudents.length} Siswa
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    L: {maleCount} | P: {femaleCount}
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-slate-500">Kehadiran Hari Ini:</span>
                  <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                    {rate}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Hadir: {presentCount} | Absen: {sickCount + permittedCount + absentCount}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onNavigateToRollcall(cls.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors shadow-2xs"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Presensi Kelas</span>
                </button>

                <button
                  onClick={() =>
                    exportAttendanceToPDF({
                      targetClass: cls,
                      students,
                      records: attendanceRecords,
                      date: selectedDate,
                      schoolProfile,
                      allClasses: classes,
                    })
                  }
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                  title="Ekspor PDF Kelas Ini"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    exportAttendanceToExcel({
                      targetClass: cls,
                      students,
                      records: attendanceRecords,
                      date: selectedDate,
                      schoolProfile,
                    })
                  }
                  className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition-colors"
                  title="Ekspor Excel Kelas Ini"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X MIPA 3 atau VII-A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="X">Tingkat X (Sepuluh)</option>
                    <option value="XI">Tingkat XI (Sebelas)</option>
                    <option value="XII">Tingkat XII (Dua Belas)</option>
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ruang Kelas</label>
                  <input
                    type="text"
                    placeholder="Contoh: R. 103"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd., M.Si."
                  value={formData.homeroomTeacher}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP Wali Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: 198203152008012015"
                  value={formData.homeroomNIP}
                  onChange={(e) => setFormData({ ...formData, homeroomNIP: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
