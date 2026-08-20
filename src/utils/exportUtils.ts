import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AttendanceRecord,
  ClassRoom,
  SchoolProfile,
  Student,
  ParentNotification,
  AttendanceStatus,
} from '../types';

export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${day} ${months[Number(month) - 1]} ${year}`;
  } catch {
    return dateString;
  }
}

export function getStatusBadgeText(status: AttendanceStatus): string {
  switch (status) {
    case 'HADIR': return 'Hadir';
    case 'SAKIT': return 'Sakit';
    case 'IZIN': return 'Izin';
    case 'ALPHA': return 'Alpha';
    default: return status;
  }
}

// Generate Excel Export (.xlsx)
export function exportAttendanceToExcel({
  targetClass,
  students,
  records,
  date,
  schoolProfile,
  notifications = [],
}: {
  targetClass?: ClassRoom;
  students: Student[];
  records: AttendanceRecord[];
  date: string;
  schoolProfile: SchoolProfile;
  notifications?: ParentNotification[];
}) {
  const dateFormatted = formatIndonesianDate(date);
  const filteredStudents = targetClass
    ? students.filter((s) => s.classId === targetClass.id)
    : students;

  // Compute stats
  let present = 0;
  let sick = 0;
  let permitted = 0;
  let absent = 0;

  const rows = filteredStudents.map((student, index) => {
    const record = records.find((r) => r.studentId === student.id && r.date === date);
    const status = record ? record.status : 'HADIR';
    const time = record?.time || '07:00';
    const notes = record?.notes || '-';
    
    if (status === 'HADIR' || (status as string) === 'TERLAMBAT') present++;
    else if (status === 'SAKIT') sick++;
    else if (status === 'IZIN') permitted++;
    else if (status === 'ALPHA') absent++;

    const notif = notifications.find((n) => n.studentId === student.id && n.date === date);
    const notifStatus = notif ? notif.deliveryStatus : '-';

    return {
      'No': index + 1,
      'NISN': student.nisn,
      'Nama Siswa': student.name,
      'L/P': student.gender,
      'Kelas': targetClass ? targetClass.name : student.classId,
      'Status Kehadiran': getStatusBadgeText(status),
      'Waktu Datang': time,
      'Keterangan': notes,
      'Nama Orang Tua': student.parentName,
      'No. HP/WA Ortu': student.parentPhone,
      'Status Notifikasi Ortu': notifStatus,
    };
  });

  const total = filteredStudents.length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';

  const summaryData = [
    { Label: 'Sekolah', Nilai: schoolProfile.name },
    { Label: 'Tanggal Laporan', Nilai: dateFormatted },
    { Label: 'Kelas', Nilai: targetClass ? targetClass.name : 'Semua Kelas' },
    { Label: 'Wali Kelas', Nilai: targetClass ? targetClass.homeroomTeacher : '-' },
    { Label: 'Guru Piket', Nilai: schoolProfile.dutyTeacherToday },
    { Label: 'Total Siswa', Nilai: total },
    { Label: 'Hadir', Nilai: `${present} (${percentage})` },
    { Label: 'Sakit (S)', Nilai: sick },
    { Label: 'Izin (I)', Nilai: permitted },
    { Label: 'Alpha / Tanpa Ket (A)', Nilai: absent },
  ];

  const wb = XLSX.utils.book_new();

  // Create attendance worksheet
  const wsAttendance = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Daftar Presensi');

  // Create summary worksheet
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik');

  const fileName = `Presensi_${targetClass ? targetClass.name.replace(/\s+/g, '_') : 'Semua_Kelas'}_${date}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Generate Official PDF Report with School Header & Signatures
export function exportAttendanceToPDF({
  targetClass,
  students,
  records,
  date,
  schoolProfile,
  allClasses,
}: {
  targetClass?: ClassRoom;
  students: Student[];
  records: AttendanceRecord[];
  date: string;
  schoolProfile: SchoolProfile;
  allClasses: ClassRoom[];
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateFormatted = formatIndonesianDate(date);
  const filteredStudents = targetClass
    ? students.filter((s) => s.classId === targetClass.id)
    : students;

  // 1. KOP SURAT SEKOLAH RESMI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH DAERAH PROVINSI JAYA RAYA', 105, 14, { align: 'center' });
  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 105, 19, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216); // Deep Navy Blue
  doc.text(schoolProfile.name, 105, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${schoolProfile.address} | Telp: ${schoolProfile.phone} | NPSN: ${schoolProfile.npsn}`, 105, 30, { align: 'center' });
  doc.text(`Email: ${schoolProfile.email} | Tahun Ajaran ${schoolProfile.academicYear} (Semester ${schoolProfile.semester})`, 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.8);
  doc.line(14, 37, 196, 37);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(14, 38.5, 196, 38.5);

  // 2. JUDUL DOKUMEN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI KEHADIRAN HARIAN SISWA', 105, 46, { align: 'center' });

  // 3. METADATA SECTION
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const className = targetClass ? targetClass.name : 'Semua Kelas (Seluruh Siswa)';
  const homeroom = targetClass ? `${targetClass.homeroomTeacher} (NIP. ${targetClass.homeroomNIP})` : 'Para Wali Kelas';

  doc.text(`Hari / Tanggal : ${dateFormatted}`, 14, 53);
  doc.text(`Kelas / Ruang  : ${className} ${targetClass ? `(${targetClass.roomNumber})` : ''}`, 14, 58);

  doc.text(`Wali Kelas     : ${homeroom}`, 110, 53);
  doc.text(`Guru Piket     : ${schoolProfile.dutyTeacherToday}`, 110, 58);

  // Compute stats
  let present = 0;
  let sick = 0;
  let permitted = 0;
  let absent = 0;

  // 4. TABLE ROWS
  const tableData = filteredStudents.map((student, idx) => {
    const record = records.find((r) => r.studentId === student.id && r.date === date);
    const status = record?.status || 'HADIR';
    const time = record?.time || '07:00';
    const notes = record?.notes || '-';

    if (status === 'HADIR' || (status as string) === 'TERLAMBAT') present++;
    else if (status === 'SAKIT') sick++;
    else if (status === 'IZIN') permitted++;
    else if (status === 'ALPHA') absent++;

    const currentClass = allClasses.find((c) => c.id === student.classId);

    return [
      idx + 1,
      student.nisn,
      student.name,
      student.gender,
      targetClass ? targetClass.name : currentClass?.name || '-',
      getStatusBadgeText(status),
      time,
      notes,
    ];
  });

  const total = filteredStudents.length;
  const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

  autoTable(doc, {
    startY: 63,
    head: [['No', 'NISN', 'Nama Peserta Didik', 'L/P', 'Kelas', 'Status', 'Waktu', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [37, 99, 235], // Primary Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'left', cellWidth: 32 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === 'Sakit') data.cell.styles.textColor = [180, 83, 9]; // Amber
        else if (text === 'Izin') data.cell.styles.textColor = [67, 56, 202]; // Indigo
        else if (text === 'Alpha') data.cell.styles.textColor = [225, 29, 72]; // Rose/Red
        else data.cell.styles.textColor = [16, 185, 129]; // Emerald
      }
    },
  });

  // 5. REKAPITULASI & TANDA TANGAN (SIGNATURE BLOCK)
  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 220;

  // If table went too close to bottom, add new page for summary & signatures
  const currentY = finalY > 230 ? (doc.addPage(), 20) : finalY;

  // Box Rekapitulasi
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, 182, 16, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('RINGKASAN KEHADIRAN:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Siswa: ${total} Orang`, 18, currentY + 11);
  doc.text(`Hadir: ${present} (${attendanceRate}%)`, 65, currentY + 11);
  doc.text(`Sakit (S): ${sick}`, 115, currentY + 11);
  doc.text(`Izin (I): ${permitted}`, 145, currentY + 11);
  doc.text(`Alpha (A): ${absent}`, 172, currentY + 11);

  // Signature Block
  const sigY = currentY + 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Kota & Tanggal tanda tangan
  doc.text(`${schoolProfile.city}, ${dateFormatted}`, 140, sigY - 4);

  // Kolom 1: Guru Piket
  doc.text('Guru Piket Harian,', 20, sigY);
  doc.text('( ............................................. )', 20, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.dutyTeacherToday.split('&')[0].trim(), 20, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${schoolProfile.dutyTeacherNIP}`, 20, sigY + 26);

  // Kolom 2: Wali Kelas
  doc.setFontSize(8.5);
  doc.text('Wali Kelas,', 140, sigY);
  doc.text('( ............................................. )', 140, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(targetClass ? targetClass.homeroomTeacher : 'Wali Kelas Terkait', 140, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(targetClass ? `NIP. ${targetClass.homeroomNIP}` : 'NIP. -', 140, sigY + 26);

  // Save the generated PDF
  const fileName = `Laporan_Presensi_${targetClass ? targetClass.name.replace(/\s+/g, '_') : 'Semua_Kelas'}_${date}.pdf`;
  doc.save(fileName);
}

// Generate Dedicated PDF for Today's Absences (Sakit, Izin, Alpha)
export function exportTodayAbsenceReportPDF({
  absentList,
  date,
  schoolProfile,
  filterType = 'ALL_ABSENT',
}: {
  absentList: Array<{
    student: Student;
    className: string;
    homeroomTeacher: string;
    record: AttendanceRecord;
    parentPhone: string;
  }>;
  date: string;
  schoolProfile: SchoolProfile;
  filterType?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateFormatted = formatIndonesianDate(date);

  // KOP SURAT SEKOLAH
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA', 105, 14, { align: 'center' });
  doc.text('DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA', 105, 19, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  doc.text(schoolProfile.name, 105, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${schoolProfile.address} | Telp: ${schoolProfile.phone} | NPSN: ${schoolProfile.npsn}`, 105, 30, { align: 'center' });
  doc.text(`Email: ${schoolProfile.email} | Tahun Ajaran ${schoolProfile.academicYear} (Semester ${schoolProfile.semester})`, 105, 34, { align: 'center' });

  // Line divider
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.8);
  doc.line(14, 37, 196, 37);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(14, 38.5, 196, 38.5);

  // JUDUL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR PESERTA DIDIK TIDAK HADIR (SAKIT, IZIN & ALPHA)', 105, 46, { align: 'center' });

  // METADATA
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Hari / Tanggal  : ${dateFormatted}`, 14, 53);
  doc.text(`Guru Piket      : ${schoolProfile.dutyTeacherToday}`, 14, 58);
  doc.text(`Kategori Laporan: ${filterType === 'ALL_ABSENT' ? 'Semua Ketidakhadiran (S/I/A)' : filterType}`, 110, 53);
  doc.text(`Total Terdata   : ${absentList.length} Siswa`, 110, 58);

  const tableData = absentList.map((item, idx) => {
    return [
      idx + 1,
      item.student.nisn,
      item.student.name,
      item.student.gender,
      item.className,
      getStatusBadgeText(item.record.status),
      item.record.notes || 'Tanpa Keterangan',
      item.student.parentName,
      item.parentPhone,
    ];
  });

  autoTable(doc, {
    startY: 63,
    head: [['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Status', 'Keterangan / Alasan', 'Orang Tua / Wali', 'No WA']],
    body: tableData.length > 0 ? tableData : [['-', '-', 'Nihil / Seluruh siswa hadir tertib', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [225, 29, 72], // Rose / Red accent for absence report
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 8 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'left', cellWidth: 35 },
      7: { halign: 'left', cellWidth: 24 },
      8: { halign: 'center', cellWidth: 16 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === 'Sakit') data.cell.styles.textColor = [180, 83, 9];
        else if (text === 'Izin') data.cell.styles.textColor = [67, 56, 202];
        else if (text === 'Alpha') data.cell.styles.textColor = [225, 29, 72];
      }
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 220;
  const currentY = finalY > 235 ? (doc.addPage(), 20) : finalY;

  // Rekapitulasi Bar
  let sickCount = 0;
  let izinCount = 0;
  let alphaCount = 0;
  absentList.forEach((item) => {
    if (item.record.status === 'SAKIT') sickCount++;
    else if (item.record.status === 'IZIN') izinCount++;
    else if (item.record.status === 'ALPHA') alphaCount++;
  });

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, currentY, 182, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(159, 18, 57);
  doc.text(`REKAPITULASI KETIDAKHADIRAN: Sakit = ${sickCount} | Izin = ${izinCount} | Alpha = ${alphaCount} | Total = ${absentList.length} Siswa`, 18, currentY + 9);

  // Signature Block
  const sigY = currentY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`${schoolProfile.city}, ${dateFormatted}`, 135, sigY - 4);

  doc.text('Guru Piket Harian,', 20, sigY);
  doc.text('( ............................................. )', 20, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.dutyTeacherToday.split('&')[0].trim(), 20, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${schoolProfile.dutyTeacherNIP}`, 20, sigY + 26);

  doc.setFontSize(8.5);
  doc.text('Kepala Sekolah,', 135, sigY);
  doc.text('( ............................................. )', 135, sigY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile.principalName, 135, sigY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${schoolProfile.principalNIP}`, 135, sigY + 26);

  doc.save(`Daftar_Sakit_Izin_Alpha_${date}.pdf`);
}

// Generate Dedicated Excel for Today's Absences
export function exportTodayAbsenceReportExcel({
  absentList,
  date,
  schoolProfile,
}: {
  absentList: Array<{
    student: Student;
    className: string;
    homeroomTeacher: string;
    record: AttendanceRecord;
    parentPhone: string;
  }>;
  date: string;
  schoolProfile: SchoolProfile;
}) {
  const rows = absentList.map((item, idx) => ({
    'No': idx + 1,
    'NISN': item.student.nisn,
    'Nama Peserta Didik': item.student.name,
    'L/P': item.student.gender,
    'Kelas': item.className,
    'Wali Kelas': item.homeroomTeacher,
    'Status Ketidakhadiran': getStatusBadgeText(item.record.status),
    'Keterangan / Alasan': item.record.notes || 'Tanpa Keterangan',
    'Nama Wali': item.student.parentName,
    'No WhatsApp Wali': item.parentPhone,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Siswa_Sakit_Izin_Alpha');
  XLSX.writeFile(wb, `Rekap_Sakit_Izin_Alpha_${schoolProfile.name.replace(/\s+/g, '_')}_${date}.xlsx`);
}
