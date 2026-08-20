import { ClassRoom, Student, AttendanceRecord, SchoolProfile, ParentNotification } from '../types';

export const initialSchoolProfile: SchoolProfile = {
  name: 'SMP NEGERI 1 PUNDONG',
  subDistrict: 'Kecamatan Pundong',
  city: 'Kabupaten Bantul',
  province: 'D.I. Yogyakarta',
  address: 'Jl. Pundong - Kretek, Menang, Srihardono, Kec. Pundong, Kab. Bantul, D.I. Yogyakarta 55771',
  npsn: '20400356',
  principalName: 'Rujito, S.Pd., M.Pd.',
  principalNIP: '196703141990031008',
  dutyTeacherToday: 'Drs. Tri Wahyono & Rina Wijayanti, S.Si.',
  dutyTeacherNIP: '196811251994121001',
  academicYear: '2025/2026',
  semester: 'Ganjil',
  phone: '(0274) 6464019',
  email: 'smpn1pundong@yahoo.co.id',
};

// 21 Kelas SMP Negeri 1 Pundong (Kelas 7A-7G, 8A-8G, 9A-9G)
export const initialClasses: ClassRoom[] = [
  // Tingkat 7 (7A - 7G)
  {
    id: 'cls-7a',
    name: '7A',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Dra. Sri Mulyani',
    homeroomNIP: '197505122000032001',
    roomNumber: 'Ruang 7A',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7b',
    name: '7B',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Bambang Supriyadi, S.Pd.',
    homeroomNIP: '198108152006041008',
    roomNumber: 'Ruang 7B',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7c',
    name: '7C',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Nur Hidayati, S.Pd.',
    homeroomNIP: '198402202009022005',
    roomNumber: 'Ruang 7C',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7d',
    name: '7D',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Ahmad Fauzi, S.Pd.I.',
    homeroomNIP: '198906102015031002',
    roomNumber: 'Ruang 7D',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7e',
    name: '7E',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Endang Purwaningsih, S.Pd.',
    homeroomNIP: '197903142008012012',
    roomNumber: 'Ruang 7E',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7f',
    name: '7F',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Drs. Tri Wahyono',
    homeroomNIP: '196811251994121001',
    roomNumber: 'Ruang 7F',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-7g',
    name: '7G',
    gradeLevel: '7',
    major: 'Reguler',
    homeroomTeacher: 'Rina Wijayanti, S.Si.',
    homeroomNIP: '199104082019032014',
    roomNumber: 'Ruang 7G',
    academicYear: '2025/2026',
    capacity: 32,
  },

  // Tingkat 8 (8A - 8G)
  {
    id: 'cls-8a',
    name: '8A',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Drs. Joko Purnomo',
    homeroomNIP: '197004121997021003',
    roomNumber: 'Ruang 8A',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8b',
    name: '8B',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Siti Rahayu, S.Pd.',
    homeroomNIP: '198307182008012017',
    roomNumber: 'Ruang 8B',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8c',
    name: '8C',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Eko Prasetyo, S.Pd.',
    homeroomNIP: '198512032010011019',
    roomNumber: 'Ruang 8C',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8d',
    name: '8D',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Dewi Lestari, S.Pd.',
    homeroomNIP: '198709282011012011',
    roomNumber: 'Ruang 8D',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8e',
    name: '8E',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Sunardi, S.Pd. Jas.',
    homeroomNIP: '197608142005011006',
    roomNumber: 'Ruang 8E',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8f',
    name: '8F',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Agustina Nurul, S.Pd.',
    homeroomNIP: '199008222019022008',
    roomNumber: 'Ruang 8F',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-8g',
    name: '8G',
    gradeLevel: '8',
    major: 'Reguler',
    homeroomTeacher: 'Arif Wibowo, S.Kom.',
    homeroomNIP: '198805172014021004',
    roomNumber: 'Ruang 8G',
    academicYear: '2025/2026',
    capacity: 32,
  },

  // Tingkat 9 (9A - 9G)
  {
    id: 'cls-9a',
    name: '9A',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Hj. Maryatun, S.Pd.',
    homeroomNIP: '197209151998022002',
    roomNumber: 'Ruang 9A',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9b',
    name: '9B',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Hadi Sudarmo, M.Pd.',
    homeroomNIP: '197401202000031004',
    roomNumber: 'Ruang 9B',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9c',
    name: '9C',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Nanik Handayani, S.Pd.',
    homeroomNIP: '198205112007012015',
    roomNumber: 'Ruang 9C',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9d',
    name: '9D',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Dwi Cahyono, S.Pd.',
    homeroomNIP: '198603092009031003',
    roomNumber: 'Ruang 9D',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9e',
    name: '9E',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Sri Hartati, S.Pd.',
    homeroomNIP: '198006242008012016',
    roomNumber: 'Ruang 9E',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9f',
    name: '9F',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Murdiyanto, S.Pd.',
    homeroomNIP: '197711082006041010',
    roomNumber: 'Ruang 9F',
    academicYear: '2025/2026',
    capacity: 32,
  },
  {
    id: 'cls-9g',
    name: '9G',
    gradeLevel: '9',
    major: 'Reguler',
    homeroomTeacher: 'Yuliana Kusumawati, S.Pd.',
    homeroomNIP: '198907302015032007',
    roomNumber: 'Ruang 9G',
    academicYear: '2025/2026',
    capacity: 32,
  },
];

// Data Peserta Didik SMP Negeri 1 Pundong (Default Kosong: 0 Siswa, siap diisi lewat Import Excel/Input Satuan)
export const initialStudents: Student[] = [];

// Helper to generate past dates format YYYY-MM-DD
export function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const todayString = getPastDate(0);

// Default kosong untuk riwayat presensi & notifikasi
export const initialAttendanceRecords: AttendanceRecord[] = [];

export const initialNotifications: ParentNotification[] = [];

export const defaultNotificationTemplates = {
  SAKIT: `Yth. Bapak/Ibu Orang Tua/Wali dari {NAMA_SISWA} ({NAMA_KELAS}),

Kami menginformasikan bahwa ananda hari ini, {TANGGAL}, tercatat *SAKIT* dengan catatan: {KETERANGAN}.

Semoga lekas sembuh dan dapat beraktivitas kembali. Mohon lampirkan surat keterangan dokter jika sakit berlanjut lebih dari 2 hari.

Hormat kami,
Wali Kelas & Tim Piket {NAMA_SEKOLAH}`,

  IZIN: `Yth. Bapak/Ibu Orang Tua/Wali dari {NAMA_SISWA} ({NAMA_KELAS}),

Presensi ananda hari ini, {TANGGAL}, tercatat *IZIN* ({KETERANGAN}) telah berhasil diverifikasi oleh pihak sekolah.

Terima kasih atas kerja sama dan informasinya.

Hormat kami,
Wali Kelas & Tim Piket {NAMA_SEKOLAH}`,

  ALPHA: `[PEMBERITAHUAN PENTING]
Yth. Bapak/Ibu Orang Tua/Wali dari {NAMA_SISWA} ({NAMA_KELAS}),

Kami menginformasikan bahwa ananda hari ini, {TANGGAL}, *BELUM HADIR* di sekolah sampai jam pelajaran dimulai tanpa keterangan resmi (ALPHA).

Mohon segera menghubungi pihak sekolah/Wali Kelas ({WALI_KELAS}) untuk konfirmasi keselamatan dan keberadaan ananda.

Hormat kami,
Tim Kesiswaan & Guru Piket {NAMA_SEKOLAH}`,
};
