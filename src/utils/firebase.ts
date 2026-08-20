import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ClassRoom,
  Student,
  AttendanceRecord,
  SchoolProfile,
  ParentNotification,
} from '../types';
import {
  initialClasses,
  initialStudents,
  initialAttendanceRecords,
  initialSchoolProfile,
  initialNotifications,
  defaultNotificationTemplates,
} from '../data/initialData';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the custom databaseId from config if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  SCHOOL_PROFILE: 'school_profile',
  NOTIFICATIONS: 'notifications',
  TEMPLATES: 'templates',
  SYNC_META: 'sync_metadata',
};

/**
 * Initialize / Seed database with initial default data if collections are empty
 */
export async function initializeFirestoreData(): Promise<{ success: boolean; seeded: boolean }> {
  try {
    const profileDocRef = doc(db, COLLECTIONS.SCHOOL_PROFILE, 'main_profile');
    const profileSnap = await getDoc(profileDocRef);

    if (!profileSnap.exists()) {
      console.log('Seeding initial data to Firestore...');
      const batch = writeBatch(db);

      // 1. Seed School Profile
      batch.set(profileDocRef, initialSchoolProfile);

      // 2. Seed Templates
      const templateDocRef = doc(db, COLLECTIONS.TEMPLATES, 'default_templates');
      batch.set(templateDocRef, { templates: defaultNotificationTemplates });

      // 3. Seed Classes
      initialClasses.forEach((cls) => {
        const clsRef = doc(db, COLLECTIONS.CLASSES, cls.id);
        batch.set(clsRef, cls);
      });

      // 4. Seed Students
      initialStudents.forEach((st) => {
        const stRef = doc(db, COLLECTIONS.STUDENTS, st.id);
        batch.set(stRef, st);
      });

      // 5. Seed Attendance
      initialAttendanceRecords.forEach((att) => {
        const attRef = doc(db, COLLECTIONS.ATTENDANCE, att.id);
        batch.set(attRef, att);
      });

      // 6. Seed Notifications
      initialNotifications.forEach((notif) => {
        const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
        batch.set(notifRef, notif);
      });

      await batch.commit();
      return { success: true, seeded: true };
    }

    return { success: true, seeded: false };
  } catch (error) {
    console.error('Error initializing Firestore data:', error);
    throw error;
  }
}

// ----------------------------------------------------
// REAL-TIME LISTENERS
// ----------------------------------------------------

export function subscribeToClasses(onData: (classes: ClassRoom[]) => void, onError?: (err: Error) => void) {
  const q = collection(db, COLLECTIONS.CLASSES);
  return onSnapshot(
    q,
    (snapshot) => {
      const data: ClassRoom[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as ClassRoom);
      });
      if (data.length > 0) {
        onData(data);
      }
    },
    (err) => {
      console.error('Firestore Classes listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToStudents(onData: (students: Student[]) => void, onError?: (err: Error) => void) {
  const q = collection(db, COLLECTIONS.STUDENTS);
  return onSnapshot(
    q,
    (snapshot) => {
      const data: Student[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Student);
      });
      if (data.length > 0) {
        onData(data);
      }
    },
    (err) => {
      console.error('Firestore Students listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToAttendance(onData: (records: AttendanceRecord[]) => void, onError?: (err: Error) => void) {
  const q = collection(db, COLLECTIONS.ATTENDANCE);
  return onSnapshot(
    q,
    (snapshot) => {
      const data: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as AttendanceRecord);
      });
      onData(data);
    },
    (err) => {
      console.error('Firestore Attendance listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToSchoolProfile(onData: (profile: SchoolProfile) => void, onError?: (err: Error) => void) {
  const docRef = doc(db, COLLECTIONS.SCHOOL_PROFILE, 'main_profile');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as SchoolProfile);
      }
    },
    (err) => {
      console.error('Firestore Profile listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToNotifications(onData: (notifs: ParentNotification[]) => void, onError?: (err: Error) => void) {
  const q = collection(db, COLLECTIONS.NOTIFICATIONS);
  return onSnapshot(
    q,
    (snapshot) => {
      const data: ParentNotification[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as ParentNotification);
      });
      onData(data);
    },
    (err) => {
      console.error('Firestore Notifications listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------------------------------------
// FIRESTORE MUTATION FUNCTIONS
// ----------------------------------------------------

export async function saveAttendanceRecordToFirebase(record: AttendanceRecord): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ATTENDANCE, record.id);
  await setDoc(docRef, record, { merge: true });
}

export async function saveBatchAttendanceToFirebase(records: AttendanceRecord[]): Promise<void> {
  const batch = writeBatch(db);
  records.forEach((record) => {
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, record.id);
    batch.set(docRef, record, { merge: true });
  });
  await batch.commit();
}

export async function saveStudentToFirebase(student: Student): Promise<void> {
  const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
  await setDoc(docRef, student, { merge: true });
}

export async function saveBatchStudentsToFirebase(studentsList: Student[]): Promise<void> {
  const batch = writeBatch(db);
  studentsList.forEach((st) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, st.id);
    batch.set(docRef, st, { merge: true });
  });
  await batch.commit();
}

export async function deleteStudentFromFirebase(studentId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.STUDENTS, studentId);
  await deleteDoc(docRef);
}

export async function deleteBatchStudentsFromFirebase(studentIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  studentIds.forEach((id) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    batch.delete(docRef);
  });
  await batch.commit();
}

export async function saveClassToFirebase(cls: ClassRoom): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLASSES, cls.id);
  await setDoc(docRef, cls, { merge: true });
}

export async function deleteClassFromFirebase(classId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLASSES, classId);
  await deleteDoc(docRef);
}

export async function saveSchoolProfileToFirebase(profile: SchoolProfile): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SCHOOL_PROFILE, 'main_profile');
  await setDoc(docRef, profile, { merge: true });
}

export async function saveNotificationToFirebase(notif: ParentNotification): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
  await setDoc(docRef, notif, { merge: true });
}

export async function saveBatchNotificationsToFirebase(notifs: ParentNotification[]): Promise<void> {
  const batch = writeBatch(db);
  notifs.forEach((notif) => {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
    batch.set(docRef, notif, { merge: true });
  });
  await batch.commit();
}

export async function resetFirestoreToDefault(): Promise<void> {
  const batch = writeBatch(db);

  // 1. Profile
  const profileDocRef = doc(db, COLLECTIONS.SCHOOL_PROFILE, 'main_profile');
  batch.set(profileDocRef, initialSchoolProfile);

  // 2. Templates
  const templateDocRef = doc(db, COLLECTIONS.TEMPLATES, 'default_templates');
  batch.set(templateDocRef, { templates: defaultNotificationTemplates });

  // 3. Classes
  initialClasses.forEach((cls) => {
    const clsRef = doc(db, COLLECTIONS.CLASSES, cls.id);
    batch.set(clsRef, cls);
  });

  // 4. Students
  initialStudents.forEach((st) => {
    const stRef = doc(db, COLLECTIONS.STUDENTS, st.id);
    batch.set(stRef, st);
  });

  // 5. Attendance
  initialAttendanceRecords.forEach((att) => {
    const attRef = doc(db, COLLECTIONS.ATTENDANCE, att.id);
    batch.set(attRef, att);
  });

  // 6. Notifications
  initialNotifications.forEach((notif) => {
    const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
    batch.set(notifRef, notif);
  });

  await batch.commit();
}
