import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import CompanySelector from '../components/CompanySelector';
import moment from 'moment-timezone';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalaryStats {
  present: number;
  halfDay: number;
  absent: number;
  off: number;
  totalEarned: number;
  totalPaid: number;
  remaining: number;
  payments: { _id: string; amount: number; paymentDate: string }[];
}

interface SalaryRow {
  assignmentId: string;
  employee: { _id: string; name: string };
  role: { _id: string; name: string };
  isClosed: boolean;
  stats: SalaryStats;
}

const SalaryPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const companyId = useSelector((state: RootState) => state.auth.activeCompanyId);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (companyId) {
      api.get('/companies').then(res => {
        const comp = res.data.companies?.find((c: any) => c._id === companyId);
        if (comp) setCompanyName(comp.name);
      }).catch(() => {});
    }
  }, [companyId]);

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; assignmentId: string; amount: string; date: string; isEdit: boolean; paymentId?: string; availablePayments?: { _id: string; amount: number; paymentDate: string }[] }>({
    isOpen: false, assignmentId: '', amount: '', date: new Date().toISOString().slice(0, 10), isEdit: false
  });

  const [closeMonthModal, setCloseMonthModal] = useState(false);
  const [reopenMonthModal, setReopenMonthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isMonthClosed = rows.length > 0 && rows.every(r => r.isClosed);

  const getDefaultPaymentDate = (selectedMonth: string) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    if (selectedMonth === currentMonth) {
      return today.toISOString().slice(0, 10);
    }
    // Return last day of selected month
    const [year, m] = selectedMonth.split('-');
    const lastDay = new Date(Number(year), Number(m), 0);
    return `${year}-${m}-${String(lastDay.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (companyId && month) {
      fetchSalary();
    } else {
      setLoading(false);
    }
  }, [companyId, month]);

  const fetchSalary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/salary`, {
        params: { month }
      });
      setRows(res.data.salaryData);
    } catch (error) {
      console.error('Failed to fetch salary data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.amount || !paymentModal.date) return;
    if (paymentModal.isEdit && !paymentModal.paymentId) return;

    setIsSubmitting(true);
    try {
      if (paymentModal.isEdit) {
        await api.put(`/companies/${companyId}/payments/${paymentModal.paymentId}`, {
          amount: Number(paymentModal.amount)
        });
        showToast('Payment updated successfully', 'success');
      } else {
        await api.post(`/companies/${companyId}/payments`, {
          assignmentId: paymentModal.assignmentId,
          amount: Number(paymentModal.amount),
          paymentDate: paymentModal.date
        });
        showToast('Payment recorded successfully', 'success');
      }
      setPaymentModal({ ...paymentModal, isOpen: false, amount: '' });
      fetchSalary();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseMonth = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/settlements/close-all`, { month });
      showToast(`Month ${month} closed successfully`, 'success');
      setCloseMonthModal(false);
      fetchSalary();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to close month', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenMonth = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/settlements/reopen-all`, { month });
      showToast(`Month ${month} reopened successfully`, 'success');
      setReopenMonthModal(false);
      fetchSalary();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reopen month', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToPDF = () => {
    if (rows.length === 0) {
      showToast('No data to export', 'info');
      return;
    }

    setIsExporting(true);

    // Yield to the browser to paint the loading state before synchronous PDF generation
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const formattedMonth = moment(month, 'YYYY-MM').format('MMMM YYYY');
        const title = companyName ? `${companyName} - Salary Report (${formattedMonth})` : `Salary Report - ${formattedMonth}`;
        doc.text(title, 14, 15);

        const tableColumn = ["Employee Name", "Role", "Present", "Half Day", "Absent", "Earned (Rs)", "Paid (Rs)", "Remaining (Rs)"];
        const tableRows: any[] = [];

        let totalPresent = 0, totalHalfDay = 0, totalAbsent = 0;
        let totalEarned = 0, totalPaid = 0, totalRemaining = 0;

        rows.forEach(r => {
          const rowData = [
            r.employee.name,
            r.role.name,
            r.stats.present,
            r.stats.halfDay,
            r.stats.absent,
            r.stats.totalEarned,
            r.stats.totalPaid,
            r.stats.remaining
          ];
          tableRows.push(rowData);
          
          totalPresent += r.stats.present;
          totalHalfDay += r.stats.halfDay;
          totalAbsent += r.stats.absent;
          totalEarned += r.stats.totalEarned;
          totalPaid += r.stats.totalPaid;
          totalRemaining += r.stats.remaining;
        });

        tableRows.push([
          'TOTAL',
          '',
          totalPresent,
          totalHalfDay,
          totalAbsent,
          totalEarned,
          totalPaid,
          totalRemaining
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [15, 118, 110] }, // teal-700
          didParseCell: function (data) {
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });

        const filePrefix = companyName ? companyName.replace(/[^a-z0-9]/gi, '_') : 'Salary';
        doc.save(`${filePrefix}_Report_${month}.pdf`);
        showToast('Export successful', 'success');
      } catch (err) {
        console.error("PDF Export Error:", err);
        showToast('Export failed', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { name: 'Home', path: '/manager', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Attendance', path: '/manager/attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'People', path: '/manager/people', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Salary', path: '/manager/salary', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', active: true },
  ];

  if (!companyId) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50">
      <p className="text-gray-500">No company selected. Go back to the dashboard.</p>
      <button onClick={() => navigate('/manager')} className="mt-4 text-teal-700 font-semibold">← Go Back</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      {/* STICKY TOP SECTION */}
      <div className="sticky top-0 z-30">
        {/* HEADER */}
        <header className="bg-teal-800 text-white p-4 rounded-b-2xl shadow-sm relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Salary Engine</h1>
          <div className="flex items-center space-x-2">
            <CompanySelector />
            {rows.length > 0 && (
              <button
                onClick={() => isMonthClosed ? setReopenMonthModal(true) : setCloseMonthModal(true)}
                className={`text-sm px-3 py-1.5 rounded-full font-bold shadow-sm ${isMonthClosed ? 'bg-white text-teal-800 border border-teal-800 hover:bg-gray-100' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
              >
                {isMonthClosed ? 'Reopen Month' : 'Close Month'}
              </button>
            )}
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1 flex items-center justify-between bg-teal-700/50 border border-teal-600 rounded-xl p-1">
            <button
              onClick={() => setMonth(moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'))}
              className="p-2 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div
              className="relative flex flex-col items-center cursor-pointer"
              onClick={() => {
                try { monthInputRef.current?.showPicker(); } catch (e) { }
              }}
            >
              <span className="text-white font-bold text-sm tracking-wide px-2 py-1">
                {moment(month, 'YYYY-MM').format('MMMM YYYY')}
              </span>
              <input
                ref={monthInputRef}
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
            </div>
            <button
              onClick={() => setMonth(moment(month, 'YYYY-MM').add(1, 'month').format('YYYY-MM'))}
              className="p-2 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className={`flex items-center justify-center border border-teal-600 rounded-xl transition-colors p-2 ${
              isExporting ? 'bg-teal-800 text-teal-300 opacity-80 cursor-wait' : 'bg-teal-700/50 hover:bg-teal-600 text-white'
            }`}
            title="Export to PDF"
          >
            {isExporting ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            )}
          </button>
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
      </div>

      {/* CLOSE MONTH CONFIRMATION MODAL */}
      {closeMonthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto bg-orange-50 text-orange-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Close {month}?</h2>
            <p className="text-sm text-gray-500 mb-6">This action will permanently lock all attendance and payment records for this month. You will not be able to edit them later.</p>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setCloseMonthModal(false)} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleCloseMonth} disabled={isSubmitting} className="flex-1 py-3 text-white font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl disabled:opacity-60">
                {isSubmitting ? 'Closing...' : 'Yes, Close Month'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN MONTH CONFIRMATION MODAL */}
      {reopenMonthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto bg-teal-50 text-teal-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Reopen {month}?</h2>
            <p className="text-sm text-gray-500 mb-6">This will unlock the month, allowing you to edit attendance and payments again.</p>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setReopenMonthModal(false)} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleReopenMonth} disabled={isSubmitting} className="flex-1 py-3 text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-60">
                {isSubmitting ? 'Reopening...' : 'Yes, Reopen Month'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (ADD/EDIT) */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-800">{paymentModal.isEdit ? 'Edit Payment' : 'Record Payment'}</h2>
            <p className="text-sm text-gray-500 mb-5">{paymentModal.isEdit ? 'Select a payment date to update its amount.' : 'Record an advance or partial payment.'}</p>
            <form onSubmit={handleRecordPayment} className="space-y-4">

              {paymentModal.isEdit ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Select Payment Date *</label>
                  <select
                    className="w-full border border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={paymentModal.paymentId || ''}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const paym = paymentModal.availablePayments?.find(p => p._id === pid);
                      setPaymentModal({
                        ...paymentModal,
                        paymentId: pid,
                        amount: paym ? paym.amount.toString() : '',
                        date: paym ? new Date(paym.paymentDate).toISOString().slice(0, 10) : ''
                      });
                    }}
                    required
                  >
                    <option value="" disabled>Select a payment...</option>
                    {paymentModal.availablePayments?.map(p => (
                      <option key={p._id} value={p._id}>
                        {new Date(p.paymentDate).toLocaleDateString('en-GB')} - ₹{p.amount}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={paymentModal.date}
                    onChange={e => setPaymentModal({ ...paymentModal, date: e.target.value })}
                    required
                  />
                </div>
              )}

              {(!paymentModal.isEdit || paymentModal.paymentId) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                    value={paymentModal.amount}
                    onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                    required min="1"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting || (paymentModal.isEdit && !paymentModal.paymentId)} className="flex-1 py-3 text-white font-semibold bg-teal-700 rounded-xl disabled:opacity-60">
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 px-4 pt-6 space-y-4">
        {loading ? (
          <div className="space-y-4 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-50">
                  <div className="h-10 bg-gray-100 rounded-xl"></div>
                  <div className="h-10 bg-gray-100 rounded-xl"></div>
                  <div className="h-10 bg-gray-100 rounded-xl"></div>
                  <div className="h-10 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="bg-teal-100 p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No Data</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              No active employees found for this month.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{rows.length} Employee{rows.length !== 1 ? 's' : ''}</p>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Total Earned</p>
            </div>
            {rows
              .filter(r => r.employee.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(({ assignmentId, employee, role, isClosed, stats }) => (
              <div key={assignmentId} className={`bg-white rounded-2xl shadow-sm border p-4 space-y-4 ${isClosed ? 'border-gray-200 opacity-90' : 'border-teal-100'}`}>
                <div className="flex items-start space-x-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isClosed ? 'bg-gray-100 text-gray-600' : 'bg-teal-100 text-teal-700'}`}>
                    {getInitials(employee?.name || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{employee?.name || 'Unknown Employee'}</p>
                    <p className="text-xs text-gray-400 mb-2">{role?.name || 'Unknown Role'}</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-green-50 px-2 py-1 rounded-md text-xs font-semibold text-green-700 border border-green-100">
                        Earned: ₹{stats.totalEarned.toLocaleString()}
                      </div>
                      <div className="bg-orange-50 px-2 py-1 rounded-md text-xs font-semibold text-orange-700 border border-orange-100 flex items-center">
                        Paid: ₹{stats.totalPaid.toLocaleString()}
                        {!isClosed && stats.payments?.length > 0 && (
                          <button
                            onClick={() => setPaymentModal({ isOpen: true, assignmentId, amount: '', date: '', isEdit: true, availablePayments: stats.payments })}
                            className="ml-1 text-orange-500 hover:text-orange-700"
                            title="Edit Payments"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                      </div>
                      <div className="bg-blue-50 px-2 py-1 rounded-md text-xs font-semibold text-blue-700 border border-blue-100">
                        Rem: ₹{stats.remaining.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <button
                      onClick={() => setPaymentModal({ isOpen: true, assignmentId, amount: '', date: getDefaultPaymentDate(month), isEdit: false })}
                      disabled={isClosed}
                      className="bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-800 shadow-sm disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {isClosed ? 'Closed' : 'Pay'}
                    </button>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Present</p>
                    <p className="font-semibold text-gray-800">{stats.present}</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Half Day</p>
                    <p className="font-semibold text-gray-800">{stats.halfDay}</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Absent</p>
                    <p className="font-semibold text-gray-800">{stats.absent}</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Off</p>
                    <p className="font-semibold text-gray-800">{stats.off}</p>
                  </div>
                </div>
              </div>
            ))}
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

export default SalaryPage;
