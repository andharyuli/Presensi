import * as XLSX from 'xlsx';
import { ClassRoom, Gender, Student } from '../types';

export interface RawStudentInput {
  nisn: string;
  name: string;
  gender: Gender;
  className: string; // e.g. "7A", "8B", "9G"
  parentName: string;
  parentPhone: string;
  address: string;
}

export function generateStudentExcelTemplate(classes: ClassRoom[]) {
  const sampleData = [
    {
      'No': 1,
      'NISN (10 Digit)': '0112345001',
      'Nama Lengkap Siswa': 'Ahmad Fauzi Pratama',
      'L/P (L=Laki-laki, P=Perempuan)': 'L',
      'Kelas (Contoh: 7A, 8B, 9G)': '7A',
      'Nama Orang Tua / Wali': 'Bpk. Hendro Santoso',
      'No WhatsApp Wali (Contoh: 6281234567890)': '6281234567890',
      'Alamat Tempat Tinggal': 'Srihardono, Pundong, Bantul',
    },
    {
      'No': 2,
      'NISN (10 Digit)': '0112345002',
      'Nama Lengkap Siswa': 'Siti Anindya Rahma',
      'L/P (L=Laki-laki, P=Perempuan)': 'P',
      'Kelas (Contoh: 7A, 8B, 9G)': '7A',
      'Nama Orang Tua / Wali': 'Ibu Dewi Sartika',
      'No WhatsApp Wali (Contoh: 6281234567890)': '6281298765432',
      'Alamat Tempat Tinggal': 'Panjangrejo, Pundong, Bantul',
    },
    {
      'No': 3,
      'NISN (10 Digit)': '0102345001',
      'Nama Lengkap Siswa': 'Bima Satria Nugraha',
      'L/P (L=Laki-laki, P=Perempuan)': 'L',
      'Kelas (Contoh: 7A, 8B, 9G)': '8B',
      'Nama Orang Tua / Wali': 'Bpk. Joko Purnomo',
      'No WhatsApp Wali (Contoh: 6281234567890)': '6281356789012',
      'Alamat Tempat Tinggal': 'Seloharjo, Pundong, Bantul',
    },
    {
      'No': 4,
      'NISN (10 Digit)': '0092345001',
      'Nama Lengkap Siswa': 'Zahra Cantika Putri',
      'L/P (L=Laki-laki, P=Perempuan)': 'P',
      'Kelas (Contoh: 7A, 8B, 9G)': '9G',
      'Nama Orang Tua / Wali': 'Bpk. Agus Salim',
      'No WhatsApp Wali (Contoh: 6281234567890)': '6281245678903',
      'Alamat Tempat Tinggal': 'Menang, Srihardono, Pundong',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 26 },
    { wch: 26 },
    { wch: 30 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Data_Siswa');

  // Sheet 2: Daftar Kelas Tersedia
  const classList = classes.map((c, idx) => ({
    'No': idx + 1,
    'Nama Kelas': c.name,
    'Tingkat': c.gradeLevel,
    'Ruang': c.roomNumber,
    'Wali Kelas': c.homeroomTeacher,
    'NIP Wali': c.homeroomNIP,
  }));
  const wsClasses = XLSX.utils.json_to_sheet(classList);
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Daftar_Kelas_SMPN1Pundong');

  XLSX.writeFile(wb, 'Template_Import_Siswa_SMPN_1_Pundong.xlsx');
}

export function parseStudentExcelFile(
  file: File,
  classes: ClassRoom[]
): Promise<{ students: Student[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawRows.length < 2) {
          resolve({ students: [], errors: ['File Excel kosong atau tidak memiliki baris data.'] });
          return;
        }

        const headerRow = rawRows[0].map((h: any) => String(h || '').toLowerCase());
        
        // Find indices
        const nisnIdx = headerRow.findIndex((h: string) => h.includes('nisn'));
        const nameIdx = headerRow.findIndex((h: string) => h.includes('nama') && !h.includes('wali') && !h.includes('orang'));
        const genderIdx = headerRow.findIndex((h: string) => h.includes('l/p') || h.includes('gender') || h.includes('jenis kelamin'));
        const classIdx = headerRow.findIndex((h: string) => h.includes('kelas'));
        const parentNameIdx = headerRow.findIndex((h: string) => h.includes('wali') || h.includes('orang tua') || h.includes('ortu'));
        const parentPhoneIdx = headerRow.findIndex((h: string) => h.includes('wa') || h.includes('phone') || h.includes('telp') || h.includes('hp') || h.includes('nomor'));
        const addressIdx = headerRow.findIndex((h: string) => h.includes('alamat'));

        const parsedStudents: Student[] = [];
        const errors: string[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || !row[nameIdx >= 0 ? nameIdx : 2]) continue;

          const rawNisn = String(row[nisnIdx >= 0 ? nisnIdx : 1] || '').trim();
          const rawName = String(row[nameIdx >= 0 ? nameIdx : 2] || '').trim();
          const rawGender = String(row[genderIdx >= 0 ? genderIdx : 3] || 'L').trim().toUpperCase();
          const rawClass = String(row[classIdx >= 0 ? classIdx : 4] || '').trim();
          const rawParentName = String(row[parentNameIdx >= 0 ? parentNameIdx : 5] || 'Wali Murid').trim();
          const rawParentPhone = String(row[parentPhoneIdx >= 0 ? parentPhoneIdx : 6] || '').replace(/[^0-9]/g, '');
          const rawAddress = String(row[addressIdx >= 0 ? addressIdx : 7] || 'Pundong, Bantul').trim();

          if (!rawName) continue;

          // Find class match
          const normalizedClass = rawClass.replace(/\s+/g, '').toUpperCase();
          const matchedClass = classes.find(
            (c) =>
              c.name.replace(/\s+/g, '').toUpperCase() === normalizedClass ||
              c.name.toUpperCase().includes(normalizedClass) ||
              c.id.toLowerCase().includes(normalizedClass.toLowerCase())
          ) || classes[0];

          const cleanPhone = rawParentPhone.startsWith('08')
            ? '628' + rawParentPhone.substring(2)
            : rawParentPhone.startsWith('8')
            ? '628' + rawParentPhone.substring(1)
            : rawParentPhone.length > 5
            ? rawParentPhone
            : '628123456789';

          parsedStudents.push({
            id: `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            nisn: rawNisn || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
            name: rawName,
            gender: rawGender.startsWith('P') ? 'P' : 'L',
            classId: matchedClass.id,
            parentName: rawParentName,
            parentPhone: cleanPhone,
            address: rawAddress,
            isActive: true,
          });
        }

        resolve({ students: parsedStudents, errors });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function parseStudentTextBatch(
  text: string,
  classes: ClassRoom[],
  defaultClassId?: string
): Student[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const result: Student[] = [];

  lines.forEach((line, idx) => {
    // Delimiters: tab, comma, semicolon, pipe
    const delimiter = line.includes('\t')
      ? '\t'
      : line.includes(';')
      ? ';'
      : line.includes('|')
      ? '|'
      : ',';

    const parts = line.split(delimiter).map((p) => p.trim());
    if (parts.length < 2) return;

    let nisn = '';
    let name = '';
    let gender: Gender = 'L';
    let classId = defaultClassId || classes[0]?.id || 'cls-7a';
    let parentName = 'Wali Murid';
    let parentPhone = '628123456789';
    let address = 'Pundong, Bantul';

    // Format heuristic:
    // Pattern A: NISN | Nama | L/P | Kelas | Wali | NoWA | Alamat
    // Pattern B: Nama | NISN | L/P
    // Pattern C: Nama Siswa saja
    if (/^\d{8,12}$/.test(parts[0])) {
      nisn = parts[0];
      name = parts[1] || '';
      if (parts[2]) gender = parts[2].toUpperCase().startsWith('P') ? 'P' : 'L';
      if (parts[3]) {
        const clsMatch = classes.find(
          (c) => c.name.toLowerCase() === parts[3].toLowerCase().replace(/\s+/g, '')
        );
        if (clsMatch) classId = clsMatch.id;
      }
      if (parts[4]) parentName = parts[4];
      if (parts[5]) parentPhone = parts[5].replace(/[^0-9]/g, '');
      if (parts[6]) address = parts[6];
    } else {
      name = parts[0];
      if (parts[1] && /^\d{8,12}$/.test(parts[1])) {
        nisn = parts[1];
      }
      if (parts[2]) gender = parts[2].toUpperCase().startsWith('P') ? 'P' : 'L';
      if (parts[3]) {
        const clsMatch = classes.find(
          (c) => c.name.toLowerCase() === parts[3].toLowerCase().replace(/\s+/g, '')
        );
        if (clsMatch) classId = clsMatch.id;
      }
      if (parts[4]) parentName = parts[4];
      if (parts[5]) parentPhone = parts[5].replace(/[^0-9]/g, '');
      if (parts[6]) address = parts[6];
    }

    if (name) {
      result.push({
        id: `std-batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        nisn: nisn || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
        name,
        gender,
        classId,
        parentName,
        parentPhone: parentPhone.startsWith('08') ? '628' + parentPhone.substring(2) : parentPhone,
        address,
        isActive: true,
      });
    }
  });

  return result;
}
