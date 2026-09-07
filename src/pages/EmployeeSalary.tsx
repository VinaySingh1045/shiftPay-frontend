import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import moment from 'moment-timezone';

interface Company {
  _id: string;
  name: string;
  assignmentId: string;
}

const EmployeeSalary = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null); // null = All
  const { showToast } = useToast();

  useEffect(() => {
    fetchSalary();
  }, [month, selectedCompanyId]);

  const fetchSalary = async () => {
    setLoading(true);
    try {
      const params: any = { month };
      if (selectedCompanyId) params.companyId = selectedCompanyId;
      const res = await api.get('/employees/me/salary', { params });
      setSalaryData(res.data);
      // Only update company list from "All" fetch so the switcher doesn't disappear
      if (!selectedCompanyId && res.data.companies) {
        setCompanies(res.data.companies);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch salary details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setMonth(moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM'));
  const handleNextMonth = () => setMonth(moment(month, 'YYYY-MM').add(1, 'month').format('YYYY-MM'));

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <header className="bg-teal-800 text-white p-6 rounded-b-3xl shadow-sm">
        <h1 className="text-xl font-bold">My Salary</h1>
      </header>

      {/* CONTENT */}
      <main className="flex-1 px-4 pt-4 pb-6 space-y-4 overflow-y-auto">

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

        {/* MONTH NAVIGATOR */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-3 shadow-sm border border-teal-100">
          <button onClick={handlePrevMonth} className="p-2 text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800">{moment(month, 'YYYY-MM').format('MMMM YYYY')}</h2>
          <button onClick={handleNextMonth} className="p-2 text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center pt-20 text-gray-400">Loading...</div>
        ) : !salaryData ? (
          <div className="flex justify-center items-center pt-20 text-gray-400">No data available</div>
        ) : (
          <div className="space-y-4">

            {salaryData.isClosed && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="text-sm font-semibold">This month is closed and finalized.</span>
              </div>
            )}

            {/* MAIN STATS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100 flex flex-col items-center text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-black text-green-600">₹{salaryData.stats.totalEarned.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100 flex flex-col items-center text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Half Payment</p>
                <p className="text-2xl font-black text-orange-500">₹{salaryData.stats.totalPaid.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-teal-700 rounded-3xl p-6 shadow-sm text-white flex flex-col items-center text-center">
              <p className="text-sm font-semibold text-teal-100 uppercase tracking-wider mb-1">Remaining Balance</p>
              <p className="text-4xl font-black">₹{salaryData.stats.remaining.toLocaleString('en-IN')}</p>
            </div>

            {/* ATTENDANCE SUMMARY */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Attendance Summary</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Present</p>
                  <p className="font-semibold text-gray-800">{salaryData.stats.present}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Half Day</p>
                  <p className="font-semibold text-gray-800">{salaryData.stats.halfDay}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Absent</p>
                  <p className="font-semibold text-gray-800">{salaryData.stats.absent}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Off</p>
                  <p className="font-semibold text-gray-800">{salaryData.stats.off}</p>
                </div>
              </div>
            </div>

            {/* PAYMENTS LIST */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Payment History</h3>
              {salaryData.payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded this month.</p>
              ) : (
                <div className="space-y-3">
                  {salaryData.payments.map((p: any) => {
                    const company = companies.find(c => c.assignmentId === p.assignmentId?.toString());
                    return (
                      <div key={p._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3 text-base font-black">
                            ₹
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{company ? company.name : 'Payment'}</p>
                            <p className="text-xs text-gray-400">{moment(p.paymentDate).format('DD MMM YYYY')}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-gray-800">₹{p.amount.toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeSalary;
