import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import CompanySelector from '../components/CompanySelector';
import moment from 'moment-timezone';

interface Role {
  _id: string;
  name: string;
  wagePerShift?: number;
}

interface AttendanceRecord {
  _id: string;
  status: 'Present' | 'Half Day' | 'Absent' | 'Full Day Off' | 'Present + Late';
}

interface EmployeeAttendanceRow {
  assignmentId: string;
  employee: { _id: string; name: string };
  role: Role;
  joiningDate: string;
  attendance: AttendanceRecord | null;
}

const AttendancePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const companyId = useSelector((state: RootState) => state.auth.activeCompanyId);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState<string>(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
  const [shift, setShift] = useState<'Day' | 'Night'>('Day');
  const [rows, setRows] = useState<EmployeeAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // track assignmentId being updated

  useEffect(() => {
    if (companyId && date && shift) {
      fetchAttendance();
    } else {
      setLoading(false);
    }
  }, [companyId, date, shift]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/attendance`, {
        params: { date, shift }
      });
      setRows(res.data.attendanceData);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      showToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (assignmentId: string, status: string, currentStatus?: string) => {
    setUpdating(assignmentId);
    try {
      if (status === currentStatus) {
        // Deselect -> delete attendance
        await api.delete(`/companies/${companyId}/attendance`, {
          data: { assignmentId, date, shift }
        });
        setRows(prevRows =>
          prevRows.map(row =>
            row.assignmentId === assignmentId
              ? { ...row, attendance: null }
              : row
          )
        );
        showToast('Attendance removed', 'info');
      } else {
        // Mark attendance
        const res = await api.post(`/companies/${companyId}/attendance`, {
          assignmentId,
          date,
          shift,
          status,
        });
        setRows(prevRows =>
          prevRows.map(row =>
            row.assignmentId === assignmentId
              ? { ...row, attendance: res.data.attendance }
              : row
          )
        );
        showToast(`Attendance marked as ${status}`, 'success');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to update attendance', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { name: 'Home', path: '/manager', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Attendance', path: '/manager/attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', active: true },
    { name: 'People', path: '/manager/people', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Salary', path: '/manager/salary', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  ];

  if (!companyId) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50">
      <p className="text-gray-500">No company selected. Go back to the dashboard.</p>
      <button onClick={() => navigate('/manager')} className="mt-4 text-teal-700 font-semibold">← Go Back</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-teal-800 text-white p-4 rounded-b-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Attendance</h1>
          <CompanySelector />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1 flex items-center justify-between bg-teal-700/50 border border-teal-600 rounded-xl p-1">
            <button
              onClick={() => setDate(moment(date, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD'))}
              className="p-1.5 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div
              className="relative flex items-center justify-center cursor-pointer"
              onClick={() => {
                try { dateInputRef.current?.showPicker(); } catch (e) { }
              }}
            >
              <span className="text-white font-bold text-xs tracking-wide">
                {moment(date, 'YYYY-MM-DD').format('DD MMM YYYY')}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
            </div>
            <button
              onClick={() => setDate(moment(date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD'))}
              className="p-1.5 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="flex-1 flex rounded-xl overflow-hidden border border-teal-600 bg-teal-700/50">
            <button
              className={`flex-1 text-sm font-semibold py-2 ${shift === 'Day' ? 'bg-white text-teal-800' : 'text-white'}`}
              onClick={() => setShift('Day')}
            >
              Day
            </button>
            <button
              className={`flex-1 text-sm font-semibold py-2 ${shift === 'Night' ? 'bg-white text-teal-800' : 'text-white'}`}
              onClick={() => setShift('Night')}
            >
              Night
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full bg-teal-700/50 border border-teal-600 text-white text-sm py-2 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-teal-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-200 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 px-4 pt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center pt-20 text-gray-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="bg-teal-100 p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No Employees Found</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Go to the People tab to add employees to this company.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{rows.length} Employee{rows.length !== 1 ? 's' : ''}</p>
            {rows
              .filter(r => r.employee.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(({ assignmentId, employee, role, attendance }) => {
                const currentStatus = attendance?.status;
                const isUpdating = updating === assignmentId;

                return (
                  <div key={assignmentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {getInitials(employee?.name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{employee?.name || 'Unknown Employee'}</p>
                        <p className="text-xs text-gray-400">{role?.name || 'Unknown Role'} · ₹{role?.wagePerShift}/shift</p>
                      </div>
                      {currentStatus && (
                        <div className="text-right flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                          ${currentStatus === 'Present' ? 'bg-green-100 text-green-700' :
                              currentStatus === 'Absent' ? 'bg-red-100 text-red-700' :
                                currentStatus === 'Half Day' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'}`}
                          >
                            {currentStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className={`grid grid-cols-4 gap-2 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button
                        onClick={() => handleMarkAttendance(assignmentId, 'Present', currentStatus)}
                        className={`text-xs font-semibold py-2 rounded-lg border transition ${currentStatus === 'Present' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        P
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(assignmentId, 'Half Day', currentStatus)}
                        className={`text-xs font-semibold py-2 rounded-lg border transition ${currentStatus === 'Half Day' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        HD
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(assignmentId, 'Absent', currentStatus)}
                        className={`text-xs font-semibold py-2 rounded-lg border transition ${currentStatus === 'Absent' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(assignmentId, 'Full Day Off', currentStatus)}
                        className={`text-xs font-semibold py-2 rounded-lg border transition ${currentStatus === 'Full Day Off' ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10">
        {navItems.map((item, idx) => (
          <button key={idx} onClick={() => navigate(item.path)} className={`flex flex-col items-center p-1 ${'active' in item && item.active ? 'text-teal-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            <span className="text-[10px] font-semibold">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AttendancePage;
