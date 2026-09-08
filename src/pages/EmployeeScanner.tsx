import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import { useToast } from '../components/Toast';

const EmployeeScanner = () => {
  const { showToast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive' | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string, details?: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Ref to ensure we only initialize the scanner once
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const requestCameraAndStart = async () => {
    try {
      console.log("Secure context:", window.isSecureContext);
      console.log("MediaDevices:", !!navigator.mediaDevices);
      console.log("URL:", window.location.href);

      if (!window.isSecureContext) {
        throw new Error("Camera requires HTTPS. This page is not a secure context.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      console.log("Camera permission granted");

      stream.getTracks().forEach((track) => track.stop());

      setPermissionDenied(false);
      setHasPermission(true);
      setScanning(true);
      setResultMessage(null);

    } catch (error: any) {
      console.error("Camera error:", error);
      console.error("Name:", error?.name);
      console.error("Message:", error?.message);

      setPermissionErrorMsg(
        `${error?.name || "UnknownError"}: ${error?.message || "Unknown error"}`
      );

      setPermissionDenied(true);
      setHasPermission(false);
    }
  };

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

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const onScanSuccess = async (decodedText: string) => {
      // Pause scanning immediately to prevent duplicate requests
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause();
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
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        }
      }
    };

    const onScanFailure = (_error: any) => {
      // Ignore routine scan failures (e.g. no QR in frame)
    };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.warn("Failed to start environment camera. Falling back.", err);
        try {
          await html5QrCode.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            onScanSuccess,
            onScanFailure
          );
        } catch (fallbackErr) {
          console.error("Camera failed entirely:", fallbackErr);
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [scanning, status, loading, showToast]);

  const handleReset = () => {
    setResultMessage(null);
    setScanning(false); // Reset to button instead of auto-scanning
    setHasPermission(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* STICKY TOP SECTION */}
      <div className="sticky top-0 z-30">
        {/* HEADER */}
        <header className="bg-teal-800 text-white p-6 rounded-b-3xl shadow-sm flex justify-between items-center relative z-10">
          <h1 className="text-xl font-bold">Employee Scanner</h1>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-xs font-semibold bg-teal-900 px-3 py-1.5 rounded-full"
          >
            Logout
          </button>
        </header>
      </div>

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
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center mt-10 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-200 mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 mb-8"></div>
            <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
          </div>
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
        ) : !scanning && !resultMessage ? (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center mt-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-teal-50 text-teal-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Scan?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Click the button below to open your camera and scan the manager's attendance QR code.
            </p>

            {permissionDenied && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-6 text-left border border-red-100">
                <p className="font-bold mb-1">Camera Access Blocked</p>
                <p className="mb-2">We couldn't access your camera. Please tap the <strong>lock icon (🔒)</strong> in your address bar, allow Camera access, and try again.</p>
                <p className="text-xs font-mono bg-red-100 p-2 rounded text-red-800 break-words">Error: {permissionErrorMsg}</p>
              </div>
            )}

            <button
              onClick={requestCameraAndStart}
              className="w-full bg-teal-700 text-white font-bold py-4 rounded-2xl hover:bg-teal-800 transition shadow-md shadow-teal-900/10 flex items-center justify-center space-x-2"
            >
              <span>Open Camera</span>
            </button>
          </div>
        ) : scanning && hasPermission ? (
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-800 font-bold text-lg">Mark Attendance</h2>
              <button onClick={handleReset} className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">Cancel</button>
            </div>
            <p className="text-gray-500 text-sm text-center mb-6">Point your camera at the Manager's QR Code.</p>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
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
