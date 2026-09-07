import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import api from '../api/axios';

const ManagerQRPage = () => {
  const navigate = useNavigate();
  const companyId = useSelector((state: RootState) => state.auth.activeCompanyId);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!companyId) return;

    const fetchToken = async () => {
      try {
        const res = await api.get(`/companies/${companyId}/qr`);
        setQrToken(res.data.token);
        setTimeLeft(55); // Reset countdown
      } catch (error) {
        console.error('Failed to fetch QR token:', error);
      }
    };

    fetchToken();
    const fetchInterval = setInterval(fetchToken, 55000); // 55 seconds

    return () => clearInterval(fetchInterval);
  }, [companyId]);

  useEffect(() => {
    if (!qrToken) return;

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [qrToken]);

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50">
        <p className="text-gray-500">No company selected.</p>
        <button onClick={() => navigate('/manager')} className="mt-4 text-teal-700 font-semibold">← Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-teal-800 text-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/manager')} className="text-white mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-xl font-bold">Attendance QR</h1>
      </header>

      <main className="flex-1 px-6 pt-10 flex flex-col items-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center w-full max-w-sm">
          <h2 className="text-gray-800 font-bold text-lg mb-2">Scan to Mark Present</h2>
          <p className="text-gray-500 text-sm mb-8 text-center">Employees can scan this code using the ShiftPay app.</p>
          
          <div className="bg-gray-50 p-4 rounded-2xl mb-6">
            {qrToken ? (
              <QRCodeSVG 
                value={qrToken} 
                size={220} 
                level="H" 
                includeMargin={true}
                className="rounded-xl"
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-xl">
                <p className="text-gray-400 font-semibold">Loading...</p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-teal-700 font-semibold bg-teal-50 px-4 py-2 rounded-full">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Refreshes in {timeLeft}s</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerQRPage;
