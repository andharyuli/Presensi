import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  Users,
  BellRing,
  School,
  Calendar,
  Clock,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { formatIndonesianDate } from '../utils/exportUtils';
import { SchoolProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schoolProfile: SchoolProfile;
  unreadNotifsCount: number;
  absentCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  schoolProfile,
  unreadNotifsCount,
  absentCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dasbor Analitik',
      icon: LayoutDashboard,
    },
    {
      id: 'today-absence',
      label: 'Daftar Izin, Sakit & Alpha',
      icon: HeartPulse,
      count: absentCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'rollcall',
      label: 'Rekapitulasi Kehadiran',
      icon: ClipboardCheck,
      badge: 'Harian Per Kelas',
    },
    {
      id: 'notifications',
      label: 'Notifikasi Ortu',
      icon: BellRing,
      count: unreadNotifsCount,
    },
    {
      id: 'classes',
      label: 'Menu Kelas',
      icon: School,
    },
    {
      id: 'students',
      label: 'Menu Siswa',
      icon: Users,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Bar with School Profile & Quick Date Picker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 border-b border-slate-100 gap-3">
          {/* Logo & School Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  {schoolProfile.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  NPSN {schoolProfile.npsn}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tahun Ajaran {schoolProfile.academicYear} &bull; Semester {schoolProfile.semester} &bull; Guru Piket: <span className="text-slate-700 font-semibold">{schoolProfile.dutyTeacherToday.split('&')[0]}</span>
              </p>
            </div>
          </div>

          {/* Quick Date Control & Duty Badge */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                id="navbar-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100 text-xs font-medium text-blue-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatIndonesianDate(selectedDate)}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && !isActive && (
                  <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
