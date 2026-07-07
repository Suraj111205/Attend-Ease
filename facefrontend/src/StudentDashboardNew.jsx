import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import './index.css';

const StudentDashboardNew = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [chartView, setChartView] = useState('weekly'); // 'weekly' | 'monthly'
  const navigate = useNavigate();

  const handleScan = async (result) => {
    if (result && result.length > 0) {
      try {
        const data = JSON.parse(result[0].rawValue);

        // ── NEW: conducted-attendance QR (multiple periods) ──
        if (data.type === 'conducted-attendance' && Array.isArray(data.periods) && data.periods.length > 0) {
          setIsScanning(false);
          const res = await axios.post(`${import.meta.env.VITE_NODE_SERVER}/api/attendance/mark-conducted`, {
            rollno: dashboardData.student.rollno,
            periods: data.periods,
            date: data.date || new Date().toISOString().split('T')[0]
          });

          // Build a friendly summary
          const results = res.data.results || [];
          const marked = results.filter(r => r.status === 'marked').map(r => r.period);
          const already = results.filter(r => r.status === 'already_marked').map(r => r.period);

          let msg = '';
          if (marked.length > 0) msg += `✅ Marked for:\n${marked.join('\n')}\n`;
          if (already.length > 0) msg += `⚠️ Already recorded:\n${already.join('\n')}`;
          alert(msg.trim() || res.data.message);

          // Refresh dashboard
          fetch(`${import.meta.env.VITE_NODE_SERVER}/api/student/${dashboardData.student.rollno}/dashboard`)
            .then(res => res.json())
            .then(d => { if (d.student) setDashboardData(d); });

        // ── LEGACY: single-period QR (backward compatibility) ──
        } else if (data.type === 'periodwise-attendance' && data.period) {
          setIsScanning(false);
          await axios.post(`${import.meta.env.VITE_NODE_SERVER}/api/periodwise-attendance`, {
            rollno: dashboardData.student.rollno,
            period: data.period,
            recognizedAt: new Date().toISOString()
          });
          alert(`✅ Attendance marked for ${data.period}`);
          fetch(`${import.meta.env.VITE_NODE_SERVER}/api/student/${dashboardData.student.rollno}/dashboard`)
            .then(res => res.json())
            .then(d => { if (d.student) setDashboardData(d); });

        } else {
          alert('Invalid QR Code Format');
        }
      } catch (e) {
        setIsScanning(false);
        if (e.response && e.response.data) {
          alert('Failed: ' + e.response.data.message);
        } else {
          alert('Failed to process QR code.');
        }
        console.error('QR Error', e);
      }
    }
  };

  useEffect(() => {
    const rollNo = localStorage.getItem('studentRollNo');
    if (!rollNo) {
      navigate('/student-login');
      return;
    }
    fetch(`${import.meta.env.VITE_NODE_SERVER}/api/student/${rollNo}/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.student) setDashboardData(data);
      })
      .catch(err => console.error("Error fetching dashboard:", err));
  }, [navigate]);

  if (!dashboardData) {
    return <div className="min-h-screen bg-[#0c0e17] flex items-center justify-center text-[#b6a0ff] text-lg font-semibold">Loading...</div>;
  }

  const { student, aggregatePresence, subjectAttendance, recentPeriodLogs, monthlyPeriodLogs } = dashboardData;

  // Helper: returns YYYY-MM-DD in the browser's LOCAL timezone (not UTC)
  const localDateStr = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // ── Weekly bar chart data (last 7 days) ──
  const weeklyBars = (() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = localDateStr(d);
      const count = (recentPeriodLogs || []).filter(log =>
        localDateStr(new Date(log.recognizedAt)) === dateStr
      ).length;
      return { day: dayNames[d.getDay()], count, isToday: i === 6, dateStr };
    });
  })();
  const maxWeeklyCount = Math.max(...weeklyBars.map(b => b.count), 1);

  // ── Monthly calendar heatmap data ──
  const monthlyCalendar = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const logs = monthlyPeriodLogs || [];
    const todayStr = localDateStr(today);

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = logs.filter(log =>
        localDateStr(new Date(log.recognizedAt)) === dateStr
      ).length;
      const isToday = dateStr === todayStr;
      return { day, count, isToday, dateStr };
    });
  })();

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 lg:pb-6 bg-split relative">
      <div className="max-w-7xl mx-auto">

        {/* ── MOBILE TOP BAR (visible only on < lg) ── */}
        <div className="flex lg:hidden items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-4">
          <h1 className="text-sm font-bold text-gray-900 leading-tight">TE Computer Engineering</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">{student.name}</span>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/student-login'; }}
              className="p-2 rounded-xl bg-[#1E2A78] text-white hover:bg-[#16239D] transition-all"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', lineHeight: 1 }}>logout</span>
            </button>
          </div>
        </div>

        {/* ── LAYOUT ROW ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SIDEBAR (desktop only) ── */}
          <aside className="hidden lg:flex w-64 shrink-0 bg-white shadow-xl rounded-2xl p-5 flex-col justify-between min-h-[calc(100vh-3rem)] sticky top-6">
            <div>
              <p className="flex items-center text-[25px] font-semibold text-gray-900 mb-6 mt-2 leading-snug">
                Third Year<br/>Computer Engineering
              </p>
              <nav className="space-y-1">
                <a className="flex items-center gap-3 px-4 py-3 text-purple-600 bg-purple-50 rounded-xl font-medium text-sm" href="#">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                  Dashboard
                </a>
                <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium" href="#">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
                  Courses
                </a>
                <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium" href="#">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event_available</span>
                  Attendance
                </a>
              </nav>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/student-login'; }}
              className="w-full py-3 rounded-xl bg-[#1E2A78] text-white flex items-center justify-center gap-2 hover:bg-[#16239D] transition-all text-sm font-bold shadow-md"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Log Out
            </button>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">

            {/* Desktop header */}
            <header className="hidden lg:flex justify-between items-center text-white mb-6 gap-4 flex-wrap">
              <div>
                <p className="text-base font-semibold">Class Co-ordinator : Mr. Kamble S.A.</p>
                <p className="text-sm text-white/60">Student Dashboard</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold">{student.name}</p>
                  <p className="text-xs text-white/60">{student.course}</p>
                </div>
                <img
                  alt="Student Profile"
                  className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlpGUUpsxv67NaY6pj5NPzZWrmRhnpNlSHGhpvwc2fsY47MnYBi2q-r8p0YwvHej5Gp7L7_Er3xwwisv7_bQ1oeML5m0Do-u5FDqrnV_37F4NLUPdlD4PLLau68KJQtC1BMYQgEUQsChqBsUmtHX-TVzsFhTDESah1SrI6DYOjm1l3fjSrjaj0x47W0paF_lF6msaxyEYKAzSxfombyrJRg0774rIFtywkzz3Yv_e13OxljJjVmGvHnjqybu8DtzR_Doraw89E84J-"
                />
              </div>
            </header>

            {/* Page title */}
            <section className="mb-6">
              <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">
                Student <span className="text-yellow-300">Dashboard</span>
              </h2>
              <p className="text-white/70 text-sm">Academic cycle 2025-2026 · TE Computer Engineering</p>
            </section>

            {/* ── CARD GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

              {/* Student Identity Card */}
              <div className="bg-surface-container-high rounded-2xl p-6 flex flex-col">
                <span className="text-xs uppercase tracking-widest text-primary font-bold mb-4 block">Student Identity</span>
                <div className="flex items-center gap-4 mb-5">
                  <img
                    alt="Portrait"
                    className="w-16 h-16 rounded-xl border border-white/10 object-cover shadow-lg shrink-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGDf04Nu7VH0isi2Elx19caa-zfjlUoAaNLs4ryyQF35crkAH8dG262_REj25hTxnL4u4bFPbCq1ytbGPPm7C3L-u3YSVEAL_uwjxbBIAUesotH1sdR46X6rfy7ZVRBGs2NBaMNbLc_3IQtYPdfLnLI6L52ooV-IIPj2UQmIPiRDrqwxb-DPBcxI5fohACK0rVnaCAHl-2LLIJn2wbVbuHqDTWraFGPXfP9mCBNA85tYkqCnpe5UlkrEtpze8LySgu64ihG0trl8hu"
                  />
                  <div className="min-w-0">
                    <h3 className="font-headline text-xl font-bold text-on-surface truncate">{student.name}</h3>
                    <p className="text-secondary font-medium text-sm">{student.rollno}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm flex-1">
                  <div className="flex justify-between py-2 border-b border-outline-variant/10 text-white">
                    <span className="font-semibold text-gray-400">Class</span>
                    <span className="font-semibold">{student.course}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant/10 text-white">
                    <span className="font-semibold text-gray-400">Semester</span>
                    <span className="font-semibold">VI</span>
                  </div>
                  <div className="flex justify-between py-2 text-white">
                    <span className="font-semibold text-gray-400">Co-ordinator</span>
                    <span className="font-semibold">Mr. Kamble S.A.</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsScanning(true)}
                  className="mt-5 w-full py-3 rounded-xl bg-primary text-on-primary font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition shadow-lg text-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>qr_code_scanner</span>
                  Scan Teacher's QR
                </button>
              </div>

              {/* Attendance Trends Card — Weekly / Monthly toggle */}
              <div className="bg-surface-container-high rounded-2xl p-6 col-span-1 sm:col-span-2 xl:col-span-1 flex flex-col">
                {/* Header + toggle */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-secondary font-bold block mb-1">Trends</span>
                    <h3 className="font-headline text-lg font-bold text-on-surface">
                      {chartView === 'weekly' ? 'Weekly' : 'Monthly'} Attendance
                    </h3>
                  </div>
                  <div className="flex rounded-xl overflow-hidden border border-surface-variant text-xs font-bold">
                    <button
                      onClick={() => setChartView('weekly')}
                      className={`px-3 py-1.5 transition-all ${chartView === 'weekly' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant/40'}`}
                    >Week</button>
                    <button
                      onClick={() => setChartView('monthly')}
                      className={`px-3 py-1.5 transition-all ${chartView === 'monthly' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant/40'}`}
                    >Month</button>
                  </div>
                </div>

                {chartView === 'weekly' ? (
                  /* ── Weekly bar chart ── */
                  <div>
                    <div className="relative h-40 flex items-end justify-between gap-1.5 mt-2">
                      <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-5">
                        <div className="border-t border-on-surface" />
                        <div className="border-t border-on-surface" />
                        <div className="border-t border-on-surface" />
                      </div>
                      {weeklyBars.map((b, i) => {
                        const heightPct = b.count === 0 ? '8%' : `${Math.max(12, Math.round((b.count / maxWeeklyCount) * 100))}%`;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t-md relative group transition-all ${b.isToday
                                ? 'bg-linear-to-t from-secondary/20 to-secondary/70'
                                : b.count > 0
                                  ? 'bg-linear-to-t from-primary/10 to-primary/50'
                                  : 'bg-surface-variant/30'
                              }`}
                            style={{ height: heightPct }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-bright px-2 py-0.5 rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {b.count} {b.count === 1 ? 'class' : 'classes'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {weeklyBars.map((b, i) => (
                        <span key={i} className={b.isToday ? 'text-secondary font-bold' : ''}>{b.day}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ── Monthly calendar heatmap ── */
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium mb-3">{monthName}</p>
                    {/* Day-of-week header */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-[9px] text-on-surface-variant font-bold uppercase">{d}</div>
                      ))}
                    </div>
                    {/* Calendar cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Offset blank cells for the start day of month */}
                      {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, i) => (
                        <div key={`blank-${i}`} />
                      ))}
                      {monthlyCalendar.map((cell) => (
                        <div
                          key={cell.day}
                          title={`${cell.dateStr}: ${cell.count} ${cell.count === 1 ? 'class' : 'classes'}`}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold relative group cursor-default transition-all ${cell.isToday
                              ? 'ring-2 ring-secondary text-secondary bg-secondary/10'
                              : cell.count >= 2
                                ? 'bg-primary/70 text-on-primary'
                                : cell.count === 1
                                  ? 'bg-primary/30 text-primary'
                                  : 'bg-surface-variant/20 text-on-surface-variant/40'
                            }`}
                        >
                          {cell.day}
                          {cell.count > 0 && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-bright text-on-surface px-2 py-0.5 rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {cell.count} {cell.count === 1 ? 'class' : 'classes'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-3 text-[9px] text-on-surface-variant">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-surface-variant/20" /><span>None</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary/30" /><span>1 class</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary/70" /><span>2+ classes</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject-wise Attendance - full width */}
              <div className="bg-surface-container-high rounded-2xl p-6 col-span-1 sm:col-span-1 xl:col-span-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-lg font-bold text-on-surface">Subject Attendance</h3>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1">
                  {subjectAttendance && subjectAttendance.length > 0 ? subjectAttendance.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${idx % 2 === 0 ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{idx % 2 === 0 ? 'book' : 'menu_book'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{item.subject}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.attended} lectures</p>
                      </div>
                      <span className="font-bold text-sm text-primary shrink-0">{item.percentage}%</span>
                    </div>
                  )) : (
                    <p className="text-slate-400 col-span-full text-sm py-4 text-center">No subject attendance recorded yet.</p>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container rounded-3xl p-6 w-full max-w-sm relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setIsScanning(false)}
              className="absolute top-4 right-4 text-on-surface hover:text-primary transition bg-white/5 p-2 rounded-full"
              aria-label="Close scanner"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>close</span>
            </button>
            <h3 className="text-xl font-headline font-bold mb-4 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">center_focus_weak</span>
              Scan Attendance QR
            </h3>
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-black w-full aspect-square">
              <Scanner
                onScan={handleScan}
                onError={(e) => console.error("Camera Error:", e)}
                constraints={{
                  facingMode: 'user',
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }}
              />
            </div>
            <p className="text-center text-on-surface-variant text-xs mt-4">Point camera at the teacher's QR to mark attendance.</p>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden z-40 px-6 py-3 flex justify-between items-center pb-safe">
        <a href="#" className="flex flex-col items-center gap-1 text-blue-600 transition-colors">
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
          <span className="material-symbols-outlined text-[24px]">school</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Courses</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
          <span className="material-symbols-outlined text-[24px]">event_available</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
        </a>
      </nav>
    </div>
  );
};

export default StudentDashboardNew;


