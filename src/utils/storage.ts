import {
  initialClasses,
  initialStudents,
  initialAttendanceRecords,
  initialSchoolProfile,
  initialNotifications,
  defaultNotificationTemplates,
} from '../data/initialData';
import {
  ClassRoom,
  Student,
  AttendanceRecord,
  SchoolProfile,
  ParentNotification,
} from '../types';

const STORAGE_KEYS = {
  CLASSES: 'presensi_classes_v2_pundong',
  STUDENTS: 'presensi_students_v2_pundong',
  ATTENDANCE: 'presensi_attendance_v2_pundong',
  PROFILE: 'presensi_profile_v2_pundong',
  NOTIFICATIONS: 'presensi_notifications_v2_pundong',
  TEMPLATES: 'presensi_templates_v2_pundong',
};

export function getStoredClasses(): ClassRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return initialClasses;
  } catch {
    return initialClasses;
  }
}

export function saveStoredClasses(classes: ClassRoom[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch (e) {
    console.error('Failed to save classes to storage', e);
  }
}

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return initialStudents;
  } catch {
    return initialStudents;
  }
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to storage', e);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return initialAttendanceRecords;
  } catch {
    return initialAttendanceRecords;
  }
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance to storage', e);
  }
}

export function getStoredSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) return parsed;
    }
    return initialSchoolProfile;
  } catch {
    return initialSchoolProfile;
  }
}

export function saveStoredSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to storage', e);
  }
}

export function getStoredNotifications(): ParentNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return initialNotifications;
  } catch {
    return initialNotifications;
  }
}

export function saveStoredNotifications(notifs: ParentNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications to storage', e);
  }
}

export function getStoredTemplates(): typeof defaultNotificationTemplates {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return raw ? JSON.parse(raw) : defaultNotificationTemplates;
  } catch {
    return defaultNotificationTemplates;
  }
}

export function saveStoredTemplates(templates: typeof defaultNotificationTemplates): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates to storage', e);
  }
}

export function clearAllStudentsData(): void {
  saveStoredStudents([]);
  saveStoredAttendance([]);
  saveStoredNotifications([]);
}

export function resetAllToDefault(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
