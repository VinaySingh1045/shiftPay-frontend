import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import api from '../api/axios';
import { useToast } from '../components/Toast';

interface Role {
  _id: string;
  name: string;
  wagePerShift: number;
}

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const [companyName, setCompanyName] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const res = await api.get(`/invite/${token}`);
        setCompanyName(res.data.company.name);
        setRoles(res.data.roles);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInviteDetails();
  }, [token]);

  const handleLoginSuccess = async (credentialResponse: any) => {
    if (!selectedRole) {
      showToast('Please select a role first', 'error');
      return;
    }

    try {
      const { credential } = credentialResponse;
      const res = await api.post('/auth/google', { 
        credential, 
        inviteToken: token,
        roleId: selectedRole 
      });
      
      dispatch(setCredentials({
        token: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user
      }));

      // Redirect to home (Attendance scanner/holding screen)
      navigate('/');
    } catch (err: any) {
      console.error('Login failed', err);
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      showToast(msg, 'error');
    }
  };

  const handleLoginError = () => {
    showToast('Google Login Failed', 'error');
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-500">Loading invite details...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
      <div className="text-red-500 bg-red-50 p-4 rounded-full mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Unavailable</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={() => navigate('/login')} className="bg-teal-700 text-white px-6 py-2 rounded-full font-semibold">Go to Login</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-md w-full mx-auto mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Join {companyName}</h1>
        <p className="text-gray-500 text-sm mb-8">You've been invited to join this company on ShiftPay.</p>

        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">1. Select your role</h3>
        <div className="space-y-3 mb-8">
          {roles.map(role => (
            <button 
              key={role._id}
              onClick={() => setSelectedRole(role._id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedRole === role._id 
                  ? 'border-teal-600 bg-teal-50' 
                  : 'border-gray-100 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${selectedRole === role._id ? 'text-teal-800' : 'text-gray-700'}`}>{role.name}</span>
                <span className={`text-sm ${selectedRole === role._id ? 'text-teal-600' : 'text-gray-400'}`}>₹{role.wagePerShift}/shift</span>
              </div>
            </button>
          ))}
          {roles.length === 0 && <p className="text-sm text-red-500">No roles available in this company.</p>}
        </div>

        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">2. Sign In to join</h3>
        <div className={`transition-opacity ${!selectedRole ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            useOneTap={false}
          />
        </div>
        {!selectedRole && <p className="text-xs text-center text-gray-400 mt-2">Select a role above to unlock sign-in</p>}
      </div>
    </div>
  );
};

export default InvitePage;
