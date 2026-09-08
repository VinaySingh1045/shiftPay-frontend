import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { setActiveCompany, logout } from '../store/authSlice';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import moment from 'moment-timezone';
import CompanySelector from '../components/CompanySelector';

interface Company {
  _id: string;
  name: string;
  status: string;
}

const ManagerDashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const activeCompanyId = useSelector((state: RootState) => state.auth.activeCompanyId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setLocalActiveCompany] = useState<Company | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  // Dashboard stats
  const [stats, setStats] = useState<{
    employeeCount: number;
    pendingSalary: number;
    month: string;
    todayAttendance: { day: { present: number; absent: number }; night: { present: number; absent: number } };
  } | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      const saved = companies.find(c => c._id === activeCompanyId);
      setLocalActiveCompany(saved || companies[0]);
      if (!saved) dispatch(setActiveCompany({ companyId: companies[0]._id }));
    }
  }, [companies, activeCompanyId]);

  useEffect(() => {
    if (activeCompany?._id) fetchDashboardStats(activeCompany._id);
  }, [activeCompany?._id]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data.companies);
    } catch (error) {
      console.error('Failed to fetch companies', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (companyId: string) => {
    try {
      const res = await api.get(`/companies/${companyId}/dashboard-summary`);
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;
    try {
      const res = await api.post('/companies', { name: newCompanyName });
      const newCompany = res.data.company;
      setCompanies([newCompany, ...companies]);
      setLocalActiveCompany(newCompany);
      dispatch(setActiveCompany({ companyId: newCompany._id }));
      setNewCompanyName('');
      setShowAddForm(false);
    } catch (error) {
      showToast('Failed to add company', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans animate-pulse">
        <header className="bg-teal-800 p-4 rounded-b-2xl shadow-sm h-20"></header>
        <main className="flex-1 px-4 pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-20"></div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-20"></div>
            </div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-24"></div>
            </div>
          </div>
        </main>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Home', path: '/manager', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', active: true },
    { name: 'Attendance', path: '/manager/attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'People', path: '/manager/people', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Salary', path: '/manager/salary', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-teal-800 text-white p-4 rounded-b-2xl shadow-sm z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">Hello, {user?.name?.split(' ')[0] || 'Manager'}</h1>
            </div>
            <p className="text-teal-100 text-sm opacity-90 mt-0.5">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <div className="relative">
              <CompanySelector onAddCompany={() => setShowAddForm(true)} />
            </div>
            <button onClick={handleLogout} className="p-1 rounded-full bg-teal-700/50 hover:bg-teal-600 transition-colors text-teal-100" title="Logout">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ADD COMPANY MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">New Company</h2>
            <form onSubmit={handleAddCompany}>
              <input type="text" placeholder="Company Name" className="w-full border border-gray-200 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} autoFocus />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-white font-semibold bg-teal-700 rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 pt-6 space-y-6">
        {activeCompany ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</p>
                <p className="text-2xl font-bold text-gray-800">{stats ? stats.employeeCount : '--'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl shadow-sm border border-orange-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending &middot; {stats ? moment(stats.month, 'YYYY-MM').format('MMM') : new Date().toLocaleString('default', { month: 'short' })}</p>
                <p className="text-2xl font-bold text-gray-800">{stats ? `₹${stats.pendingSalary.toLocaleString('en-IN')}` : '₹--'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today's Attendance</p>
              <div className="space-y-3">
                {(['Day', 'Night'] as const).map((shift, i) => {
                  const shiftStats = stats?.todayAttendance?.[shift.toLowerCase() as 'day' | 'night'];
                  return (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{shift} Shift</p>
                        <p className="text-xs text-gray-400">{i === 0 ? '6:00 AM – 6:00 PM' : '6:00 PM – 6:00 AM'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-600">{shiftStats ? shiftStats.present : '--'}</p>
                        <p className="text-xs text-gray-400">present · {shiftStats ? shiftStats.absent : '--'} absent</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Mark Attendance', path: '/manager/attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { title: 'Show QR Code', path: '/manager/qr', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
                  { title: 'Employees', path: '/manager/people', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { title: 'Salary', path: '/manager/salary', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
                ].map((action, idx) => (
                  <button key={idx} onClick={() => navigate(action.path)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start justify-center text-left hover:bg-teal-50 transition">
                    <div className="bg-teal-100 p-2 rounded-full mb-3 text-teal-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} /></svg>
                    </div>
                    <span className="font-semibold text-sm text-gray-800">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="bg-teal-100 p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Companies Yet</h2>
            <p className="text-gray-500 mb-6 max-w-xs">Create your first company to start managing attendance and salary.</p>
            <button onClick={() => setShowAddForm(true)} className="bg-teal-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-teal-200">+ Create Company</button>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10">
        {navItems.map((item, idx) => (
          <button key={idx} onClick={() => navigate(item.path)} className={`flex flex-col items-center p-1 ${item.active ? 'text-teal-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            <span className="text-[10px] font-semibold">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ManagerDashboard;
