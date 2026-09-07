import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';

const EmployeeScanner = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive' | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string, details?: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Ref to ensure we only initialize the scanner once
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/employees/me');
        setStatus(res.data.status);
        setCompanyName(res.data.company?.name || '');
      } catch (error) {
        console.error('Failed to fetch employee status', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!scanning || loading || status === 'inactive') return;

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.0
      }, 
      false
    );

    scannerRef.current = html5QrcodeScanner;

    const onScanSuccess = async (decodedText: string) => {
      // Pause scanning immediately to prevent duplicate requests
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }
      setScanning(false);

      try {
        const res = await api.post('/employees/scan', { token: decodedText });
        setResultMessage({ 
          type: 'success', 
          text: res.data.message,
          details: `Shift: ${res.data.shift} | Date: ${res.data.date}`
        });
        showToast('Successfully marked present!', 'success');
      } catch (error: any) {
        setResultMessage({ 
          type: 'error', 
          text: error?.response?.data?.error || 'Failed to scan QR code.' 
        });
        showToast('Scan failed', 'error');
      } finally {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      }
    };

    const onScanFailure = (error: any) => {
      // Ignore routine scan failures (e.g. no QR in frame)
    };

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [scanning, status, loading, showToast]);

  const handleReset = () => {
    setResultMessage(null);
    setScanning(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* HEADER */}
      <header className="bg-teal-800 text-white p-6 rounded-b-3xl shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">Employee Scanner</h1>
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="text-xs font-semibold bg-teal-900 px-3 py-1.5 rounded-full"
        >
          Logout
        </button>
      </header>

      {/* LOGOUT CONFIRM MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Log Out?</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out of ShiftPay?</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  api.post('/auth/logout').finally(() => { window.location.href = '/login'; });
                }}
                className="flex-1 py-3 text-white font-semibold bg-red-500 rounded-xl hover:bg-red-600"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center pt-20 text-gray-400">Loading...</div>
        ) : status === 'inactive' ? (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex flex-col items-center text-center mt-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-50 text-orange-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pending Approval</h2>
            <p className="text-gray-600 mb-6">
              You have requested to join <strong>{companyName}</strong>. Please wait for your manager to verify and approve your account.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-teal-700 text-white font-bold py-3 rounded-xl hover:bg-teal-800 transition shadow-sm"
            >
              Refresh Status
            </button>
          </div>
        ) : scanning ? (
          <div className="w-full max-w-sm">
            <h2 className="text-gray-800 font-bold text-center text-lg mb-2">Mark Attendance</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Point your camera at the Manager's QR Code.</p>
            
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               {/* Container for html5-qrcode */}
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden [&>video]:object-cover [&>video]:rounded-2xl"></div>
            </div>
          </div>
        ) : resultMessage ? (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center mt-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${resultMessage.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {resultMessage.type === 'success' ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {resultMessage.type === 'success' ? 'Success!' : 'Scan Failed'}
            </h2>
            <p className="text-gray-600 mb-4">{resultMessage.text}</p>
            {resultMessage.details && (
              <p className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-md mb-6">{resultMessage.details}</p>
            )}
            
            <button 
              onClick={handleReset}
              className="w-full bg-teal-700 text-white font-bold py-3 rounded-xl hover:bg-teal-800 transition shadow-sm"
            >
              Scan Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmployeeScanner;
