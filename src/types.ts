export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TERLAMBAT';

export type Gender = 'L' | 'P';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: Gender;
  classId: string;
  parentName: string;
  parentPhone: string;
  address: string;
  email?: string;
  isActive: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  gradeLevel: string; // e.g. "X", "XI", "XII" or "7", "8", "9"
  major?: string; // e.g. "MIPA", "IPS", "Teknik", "Umum"
  homeroomTeacher: string;
  homeroomNIP: string;
  roomNumber: string;
  academicYear: string;
  capacity?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  time: string; // HH:mm
  notes?: string;
  recordedBy: string; // e.g., "Guru Piket" or "Wali Kelas"
  lateMinutes?: number;
  updatedAt?: string;
}

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';

export interface ParentNotification {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  message: string;
  channel: NotificationChannel;
  deliveryStatus: NotificationDeliveryStatus;
  sentAt?: string;
  confirmedAt?: string;
  parentReply?: string;
  confirmationMethod?: 'WA_CHAT' | 'PHONE_CALL' | 'SURAT_FISIK' | 'SISTEM';
}

export interface SchoolProfile {
  name: string;
  subDistrict: string;
  city: string;
  province: string;
  address: string;
  npsn: string;
  principalName: string;
  principalNIP: string;
  dutyTeacherToday: string; // Guru Piket Hari Ini
  dutyTeacherNIP: string;
  academicYear: string;
  semester: string;
  phone: string;
  email: string;
}

export interface AttendanceSummary {
  totalStudents: number;
  present: number;
  sick: number;
  permitted: number;
  absent: number; // Alpha
  late: number;
  attendanceRate: number; // Percentage
}

export interface ClassDailyRecap {
  classId: string;
  className: string;
  homeroomTeacher: string;
  totalStudents: number;
  presentCount: number;
  sickCount: number;
  permittedCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
}

export interface FilterOptions {
  date: string;
  classId: string;
  searchQuery: string;
  statusFilter: string;
}
