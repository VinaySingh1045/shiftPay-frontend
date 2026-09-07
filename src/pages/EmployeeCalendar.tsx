import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import moment from 'moment-timezone';

interface Company {
  _id: string;
  name: string;
  assignmentId: string;
}

const EmployeeCalendar = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null); // null = All
  const [showLegend, setShowLegend] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [month, selectedCompanyId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params: any = { month };
      if (selectedCompanyId) params.companyId = selectedCompanyId;
      const res = await api.get('/employees/me/attendance', { params });
      setAttendances(res.data.attendances);
      // Only update company list from "All" fetch so the switcher doesn't disappear
      if (!selectedCompanyId && res.data.companies) {
        setCompanies(res.data.companies);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setMonth(moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'));
  const handleNextMonth = () => setMonth(moment(month, 'YYYY-MM').add(1, 'month').format('YYYY-MM'));

  const generateGrid = () => {
    const startOfMonth = moment(month, 'YYYY-MM').startOf('month');
    const endOfMonth = moment(month, 'YYYY-MM').endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    const grid = [];
    let dayCounter = 1;
    for (let row = 0; row < 6; row++) {
      const rowDays = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startDay) rowDays.push(null);
        else if (dayCounter > daysInMonth) rowDays.push(null);
        else { rowDays.push(dayCounter); dayCounter++; }
      }
      grid.push(rowDays);
      if (dayCounter > daysInMonth) break;
    }
    return grid;
  };

  const grid = generateGrid();

  const getColor = (status: string) => {
    switch (status) {
      case 'Present': return '#22c55e';
      case 'Half Day': return '#facc15';
      case 'Absent': return '#ef4444';
      case 'Full Day Off': return '#3b82f6';
      default: return '#f3f4f6';
    }
  };

  const getDayStyle = (day: number) => {
    const targetDateStr = `${month}-${String(day).padStart(2, '0')}`;
    const targetDateIST = moment.tz(targetDateStr, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day').valueOf();
    const dayAttendances = attendances.filter(a => moment(a.date).valueOf() === targetDateIST);

    if (dayAttendances.length === 0) return { className: 'bg-gray-100 border-gray-200 text-gray-500' };

    if (dayAttendances.length === 1) {
      switch (dayAttendances[0].status) {
        case 'Present': return { className: 'bg-green-500 border-green-600 text-white shadow-sm' };
        case 'Half Day': return { className: 'bg-yellow-400 border-yellow-500 text-white shadow-sm' };
        case 'Absent': return { className: 'bg-red-500 border-red-600 text-white shadow-sm' };
        case 'Full Day Off': return { className: 'bg-blue-500 border-blue-600 text-white shadow-sm' };
        default: return { className: 'bg-gray-100 border-gray-200 text-gray-500' };
      }
    }

    // Multiple attendances — use split circle (e.g. Day + Night, or 2 companies)
    const c1 = getColor(dayAttendances[0].status);
    const c2 = getColor(dayAttendances[1].status);
    return {
      className: 'text-white shadow-sm border-white',
      style: { background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` }
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <header className="bg-teal-800 text-white p-6 rounded-b-3xl shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold">My Calendar</h1>
        <button onClick={() => setShowLegend(true)} className="p-2 bg-teal-700 rounded-full hover:bg-teal-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* LEGEND MODAL */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Status Legend</h2>
              <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-green-500 mr-3"></div><span className="text-gray-700 font-medium">Present</span></div>
              <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-yellow-400 mr-3"></div><span className="text-gray-700 font-medium">Half Day</span></div>
              <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-red-500 mr-3"></div><span className="text-gray-700 font-medium">Absent</span></div>
              <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-blue-500 mr-3"></div><span className="text-gray-700 font-medium">Full Day Off</span></div>
              <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 mr-3"></div><span className="text-gray-700 font-medium">Not Marked</span></div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full mr-3 border border-white shadow-sm" style={{ background: 'linear-gradient(135deg, #22c55e 50%, #facc15 50%)' }}></div>
                <span className="text-gray-700 font-medium">Two shifts / Two companies</span>
              </div>
            </div>
            <button onClick={() => setShowLegend(false)} className="w-full mt-6 bg-teal-700 text-white font-bold py-3 rounded-xl">Got it</button>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 px-4 pt-4 pb-6 space-y-3 overflow-y-auto">

        {/* COMPANY SWITCHER */}
        {companies.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCompanyId(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                selectedCompanyId === null ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              All
            </button>
            {companies.map(c => (
              <button
                key={c._id}
                onClick={() => setSelectedCompanyId(c._id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  selectedCompanyId === c._id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-teal-100 p-5">
          {/* MONTH NAVIGATOR */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevMonth} className="p-2 text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">{moment(month, 'YYYY-MM').format('MMMM YYYY')}</h2>
            <button onClick={handleNextMonth} className="p-2 text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center text-xs font-bold text-gray-400 mb-2">{day}</div>
                ))}
              </div>
              <div className="space-y-4">
                {grid.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-7 gap-1">
                    {row.map((day, colIdx) => (
                      <div key={colIdx} className="flex justify-center">
                        {day ? (() => {
                          const { className, style } = getDayStyle(day);
                          return (
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold border ${className}`}
                              style={style}
                            >
                              {day}
                            </div>
                          );
                        })() : <div className="w-10 h-10"></div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeCalendar;
