import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  ArrowRight,
  Database,
} from 'lucide-react';
import { ClassRoom, Student } from '../types';
import {
  generateStudentExcelTemplate,
  parseStudentExcelFile,
  parseStudentTextBatch,
} from '../utils/studentImportUtils';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  onImportSuccess: (newStudents: Student[]) => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportSuccess,
}) => {
  const [importMode, setImportMode] = useState<'EXCEL' | 'PASTE'>('EXCEL');
  const [pasteText, setPasteText] = useState('');
  const [targetClassId, setTargetClassId] = useState<string>('AUTO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Student[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const { students, errors } = await parseStudentExcelFile(file, classes);
      if (errors.length > 0) {
        setErrorMessage(errors.join(', '));
      }
      if (students.length > 0) {
        setParsedPreview(students);
      } else if (errors.length === 0) {
        setErrorMessage('Tidak ada data siswa yang valid dalam file Excel.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPaste = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Silakan tempel (paste) data teks siswa terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const defaultClass = targetClassId !== 'AUTO' ? targetClassId : undefined;
      const students = parseStudentTextBatch(pasteText, classes, defaultClass);
      if (students.length === 0) {
        setErrorMessage('Format teks tidak dikenali. Pastikan terdapat kolom Nama Siswa.');
      } else {
        setParsedPreview(students);
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan saat memproses teks.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (parsedPreview.length === 0) return;
    onImportSuccess(parsedPreview);
    setParsedPreview([]);
    setPasteText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Import Data Siswa Massal</h3>
              <p className="text-xs text-blue-100">
                Masukkan database siswa SMP Negeri 1 Pundong via File Excel atau Salin Teks
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setImportMode('EXCEL');
                setParsedPreview([]);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                importMode === 'EXCEL'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload File Excel (.xlsx / .csv)</span>
            </button>
            <button
              onClick={() => {
                setImportMode('PASTE');
                setParsedPreview([]);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                importMode === 'PASTE'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Salin & Tempel (Paste Text)</span>
            </button>
          </div>

          {/* Mode 1: Excel Upload */}
          {importMode === 'EXCEL' && (
            <div className="space-y-4">
              {/* Template Download Box */}
              <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-bold text-blue-900">Belum punya format Excel?</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Unduh template resmi berisi kolom NISN, Nama, L/P, Kelas (7A-9G), No WA Wali, & Alamat.
                  </p>
                </div>
                <button
                  onClick={() => generateStudentExcelTemplate(classes)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  Pilih file Excel (.xlsx / .xls / .csv) dari komputer
                </p>
                <p className="text-[11px] text-slate-500">
                  Klik di sini untuk menjelajahi file pada penyimpanan Anda
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Paste Text */}
          {importMode === 'PASTE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Tempel Baris Data dari Excel / Tabel (Kolom: NISN, Nama, L/P, Kelas, Wali, WA, Alamat):
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="AUTO">Deteksi Kelas Otomatis</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Terapkan ke Kelas {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Contoh salinan Excel:&#10;0112345001&#9;Ahmad Fauzi&#9;L&#9;7A&#9;Hendro&#9;62812345678&#9;Srihardono&#10;0112345002&#9;Siti Rahma&#9;P&#9;7A&#9;Sartika&#9;6281298765&#9;Panjangrejo"
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleProcessPaste}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Proses Data Teks
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Siap Dimasukkan: {parsedPreview.length} Siswa Terdeteksi</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Periksa data sebelum disimpan ke database
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">NISN</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-2 text-center">L/P</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Wali Murid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedPreview.map((st, i) => {
                      const cls = classes.find((c) => c.id === st.classId);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-1.5 px-3 font-mono">{st.nisn}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{st.name}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-blue-700">
                            {st.gender}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">
                            {cls?.name || st.classId}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{st.parentName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Batal
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={parsedPreview.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all ${
              parsedPreview.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Simpan {parsedPreview.length > 0 ? `${parsedPreview.length} Siswa ` : ''}ke Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
