import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Eye,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AttendanceRecord,
  ClassRoom,
  Gender,
  Student,
} from '../types';
import { ImportStudentsModal } from './ImportStudentsModal';
import { generateStudentExcelTemplate } from '../utils/studentImportUtils';

interface StudentManagementProps {
  students: Student[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (newStudent: Student) => void;
  onBulkAddStudents?: (newStudents: Student[]) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onSelectStudentDetail: (student: Student) => void;
  onClearAllStudents?: () => void;
  onClearStudentsByClass?: (classId: string) => void;
  onDeleteMultipleStudents?: (studentIds: string[]) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  classes,
  attendanceRecords,
  onAddStudent,
  onBulkAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onSelectStudentDetail,
  onClearAllStudents,
  onClearStudentsByClass,
  onDeleteMultipleStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    nisn: '',
    name: '',
    gender: 'L',
    classId: classes[0]?.id || '',
    parentName: '',
    parentPhone: '',
    address: '',
    email: '',
    isActive: true,
  });

  // Filter classes based on grade level
  const displayedClasses = useMemo(() => {
    if (selectedGradeFilter === 'ALL') return classes;
    return classes.filter((c) => c.gradeLevel === selectedGradeFilter);
  }, [classes, selectedGradeFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery) ||
        s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      const stClass = classes.find((c) => c.id === s.classId);
      if (selectedGradeFilter !== 'ALL' && stClass?.gradeLevel !== selectedGradeFilter) {
        return false;
      }

      if (selectedClassFilter !== 'ALL' && s.classId !== selectedClassFilter) {
        return false;
      }

      if (selectedGenderFilter !== 'ALL' && s.gender !== selectedGenderFilter) {
        return false;
      }

      return true;
    });
  }, [students, classes, searchQuery, selectedGradeFilter, selectedClassFilter, selectedGenderFilter]);

  const currentFilteredClassObj = useMemo(() => {
    if (selectedClassFilter === 'ALL') return null;
    return classes.find((c) => c.id === selectedClassFilter) || null;
  }, [classes, selectedClassFilter]);

  const handleSelectAllFiltered = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedStudentIds.length === 0) return;
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} data siswa terpilih?`
      )
    ) {
      if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(selectedStudentIds);
      } else {
        selectedStudentIds.forEach((id) => onDeleteStudent(id));
      }
      setSelectedStudentIds([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      nisn: `01${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: '',
      gender: 'L',
      classId: selectedClassFilter !== 'ALL' ? selectedClassFilter : classes[0]?.id || '',
      parentName: '',
      parentPhone: '62812',
      address: 'Pundong, Bantul',
      email: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormData({
      nisn: st.nisn,
      name: st.name,
      gender: st.gender,
      classId: st.classId,
      parentName: st.parentName,
      parentPhone: st.parentPhone,
      address: st.address,
      email: st.email || '',
      isActive: st.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...formData,
        id: editingStudent.id,
      });
    } else {
      const newId = `std-${Date.now()}`;
      onAddStudent({
        ...formData,
        id: newId,
      });
    }
    setIsModalOpen(false);
  };

  const handleImportBulk = (newStudents: Student[]) => {
    if (onBulkAddStudents) {
      onBulkAddStudents(newStudents);
    } else {
      newStudents.forEach((st) => onAddStudent(st));
    }
  };

  const handleExportAllStudentsToExcel = () => {
    const data = filteredStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId);
      return {
        'No': idx + 1,
        'NISN': s.nisn,
        'Nama Lengkap': s.name,
        'L/P': s.gender,
        'Kelas': cls?.name || '-',
        'Tingkat': cls?.gradeLevel || '-',
        'Nama Wali': s.parentName,
        'No WhatsApp': s.parentPhone,
        'Alamat': s.address,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database_Siswa');
    XLSX.writeFile(wb, `Database_Siswa_SMPN1Pundong_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExecuteClearAll = () => {
    if (onClearAllStudents) {
      onClearAllStudents();
    }
    setSelectedStudentIds([]);
    setIsClearConfirmModalOpen(false);
  };

  const handleClearCurrentClass = () => {
    if (!currentFilteredClassObj) return;
    if (
      confirm(
        `Hapus semua siswa kelas ${currentFilteredClassObj.name} (${
          students.filter((s) => s.classId === currentFilteredClassObj.id).length
        } siswa)?`
      )
    ) {
      if (onClearStudentsByClass) {
        onClearStudentsByClass(currentFilteredClassObj.id);
      } else {
        students
          .filter((s) => s.classId === currentFilteredClassObj.id)
          .forEach((s) => onDeleteStudent(s.id));
      }
      setSelectedStudentIds([]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Database Explanatory Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-3xl p-6 text-white shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wide backdrop-blur-xs">
              <Database className="w-3.5 h-3.5 text-blue-200" />
              <span>Pusat Database Siswa SMP Negeri 1 Pundong</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Manajemen Data Peserta Didik (21 Kelas: 7A-G, 8A-G, 9A-G)
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Daftar siswa tersimpan pada database lokal aplikasi. Anda dapat mengunggah file data siswa dengan <strong>Import Excel / CSV</strong>, menambah siswa <strong>satuan</strong>, atau <strong>mengosongkan daftar siswa</strong> kapan saja jika ingin memulai ulang data.
            </p>
          </div>

          {/* Action Buttons for Database Input */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {students.length > 0 && (
              <button
                onClick={() => setIsClearConfirmModalOpen(true)}
                className="flex items-center gap-2 bg-rose-500/80 hover:bg-rose-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur-xs transition-colors"
                title="Kosongkan seluruh daftar siswa jika ingin reset data atau upload ulang"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Daftar Siswa</span>
              </button>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel / CSV</span>
            </button>

            <button
              onClick={() => generateStudentExcelTemplate(classes)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur-xs transition-colors"
              title="Unduh format tabel Excel yang siap diisi data siswa"
            >
              <Download className="w-4 h-4" />
              <span>Format Template</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Quick Database Stat Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 block font-medium">Total Siswa Terdaftar</span>
            <span className="text-lg font-black text-white">{students.length} Siswa</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 block font-medium">Kelas 7 (7A - 7G)</span>
            <span className="text-lg font-black text-white">
              {students.filter((s) => classes.find((c) => c.id === s.classId)?.gradeLevel === '7').length} Siswa
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 block font-medium">Kelas 8 (8A - 8G)</span>
            <span className="text-lg font-black text-white">
              {students.filter((s) => classes.find((c) => c.id === s.classId)?.gradeLevel === '8').length} Siswa
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 block font-medium">Kelas 9 (9A - 9G)</span>
            <span className="text-lg font-black text-white">
              {students.filter((s) => classes.find((c) => c.id === s.classId)?.gradeLevel === '9').length} Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Grade Level Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tingkat Jenjang Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => {
                setSelectedGradeFilter('ALL');
                setSelectedClassFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedGradeFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tingkat (21 Kelas)
            </button>
            <button
              onClick={() => {
                setSelectedGradeFilter('7');
                setSelectedClassFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedGradeFilter === '7'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas 7 (7A - 7G)
            </button>
            <button
              onClick={() => {
                setSelectedGradeFilter('8');
                setSelectedClassFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedGradeFilter === '8'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas 8 (8A - 8G)
            </button>
            <button
              onClick={() => {
                setSelectedGradeFilter('9');
                setSelectedClassFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedGradeFilter === '9'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas 9 (9A - 9G)
            </button>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {currentFilteredClassObj && students.some((s) => s.classId === currentFilteredClassObj.id) && (
              <button
                onClick={handleClearCurrentClass}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl transition-colors border border-rose-200"
                title={`Hapus semua siswa khusus kelas ${currentFilteredClassObj.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Kelas {currentFilteredClassObj.name}</span>
              </button>
            )}

            {filteredStudents.length > 0 && (
              <button
                onClick={handleExportAllStudentsToExcel}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                title="Ekspor daftar siswa saat ini ke file Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Excel ({filteredStudents.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama, NISN, nama wali, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">
                {selectedGradeFilter === 'ALL' ? 'Semua 21 Kelas' : `Semua Kelas ${selectedGradeFilter}`}
              </option>
              {displayedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} ({students.filter((s) => s.classId === cls.id).length} siswa)
                </option>
              ))}
            </select>

            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>

        {/* Selected Batch Action Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>{selectedStudentIds.length} Siswa Terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStudentIds([])}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200"
              >
                Batal Pilih
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedStudentIds.length} Siswa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">
                  <button
                    onClick={handleSelectAllFiltered}
                    disabled={filteredStudents.length === 0}
                    className="text-slate-500 hover:text-blue-600 disabled:opacity-30"
                    title="Pilih Semua"
                  >
                    {selectedStudentIds.length > 0 &&
                    selectedStudentIds.length === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-2 text-center w-10">No</th>
                <th className="py-3.5 px-4">Nama Siswa & NISN</th>
                <th className="py-3.5 px-2 text-center w-12">L/P</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Wali Murid & No WA</th>
                <th className="py-3.5 px-4">Alamat Domisili</th>
                <th className="py-3.5 px-3 text-center">Tingkat Hadir</th>
                <th className="py-3.5 px-3 text-center">Rekap (S/I/A)</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-sm">
                          {students.length === 0
                            ? 'Daftar Siswa Masih Kosong (0 Siswa)'
                            : 'Tidak Ada Siswa Sesuai Filter'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {students.length === 0
                            ? 'Database peserta didik telah dikosongkan. Silakan klik "Import Excel / CSV" untuk mengunggah file data siswa baru, atau gunakan tombol "Format Template" untuk mendapatkan format kolom yang rapi.'
                            : 'Silakan ubah kata kunci pencarian atau reset filter kelas di atas.'}
                        </p>
                      </div>
                      {students.length === 0 && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File Excel Sekarang</span>
                          </button>
                          <button
                            onClick={handleOpenAdd}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Input Manual 1 Siswa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const currentClass = classes.find((c) => c.id === st.classId);
                  const isSelected = selectedStudentIds.includes(st.id);

                  // Stats calculation
                  const stRecords = attendanceRecords.filter((r) => r.studentId === st.id);
                  let present = 0;
                  let sick = 0;
                  let permitted = 0;
                  let absent = 0;

                  stRecords.forEach((r) => {
                    if (r.status === 'HADIR' || r.status === 'TERLAMBAT') present++;
                    else if (r.status === 'SAKIT') sick++;
                    else if (r.status === 'IZIN') permitted++;
                    else if (r.status === 'ALPHA') absent++;
                  });

                  const total = stRecords.length;
                  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '100';

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-blue-50/30 transition-colors group ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(st.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-2 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectStudentDetail(st)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NISN: {st.nisn}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'L'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {st.gender}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-800">
                          {currentClass ? `Kelas ${currentClass.name}` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {st.parentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {st.parentPhone}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate" title={st.address}>
                        {st.address || '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-extrabold ${
                            Number(rate) >= 90
                              ? 'text-emerald-600'
                              : Number(rate) >= 75
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-medium text-slate-600 text-[11px]">
                        <span className="text-amber-700 font-bold">{sick}S</span> &bull;{' '}
                        <span className="text-indigo-700 font-bold">{permitted}I</span> &bull;{' '}
                        <span className="text-rose-700 font-bold">{absent}A</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectStudentDetail(st)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Lihat Riwayat & Profil Siswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus data ${st.name} dari database?`)) {
                                onDeleteStudent(st.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Import Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        classes={classes}
        onImportSuccess={handleImportBulk}
      />

      {/* Clear All Confirmation Modal */}
      {isClearConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Kosongkan Semua Data Siswa?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus <strong>{students.length} siswa</strong> yang saat ini terdaftar beserta riwayat presensi dan notifikasinya dari database.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] text-left mt-2">
                <strong>Catatan:</strong> Struktur 21 Kelas (7A-G, 8A-G, 9A-G) dan profil SMP Negeri 1 Pundong akan tetap tersimpan dan siap untuk upload file data siswa baru.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Ya, Kosongkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Single Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru ke Database'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    SMP Negeri 1 Pundong &bull; NPSN 20400356
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    placeholder="0112345001"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Kelas (21 Kelas Tersedia)</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name} &bull; {cls.roomNumber} (Wali: {cls.homeroomTeacher})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Hendro Santoso"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="628123456789"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  placeholder="Contoh: Menang, Srihardono, Pundong, Bantul"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
