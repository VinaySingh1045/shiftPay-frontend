import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/authSlice';
import api from '../api/axios';
import { useToast } from '../components/Toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLoginSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;
      // Send token to our backend
      const res = await api.post('/auth/google', { credential });
      
      // Store in Redux
      dispatch(setCredentials({
        token: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user
      }));

      // Redirect based on role or to home
      if (res.data.user.role === 'manager') {
        navigate('/manager'); // We will build this later
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login failed', error);
      const msg = error.response?.data?.error || 'Login failed. Please try again.';
      showToast(msg, 'error');
    }
  };

  const handleLoginError = () => {
    console.error('Google Login Failed');
    showToast('Google Login Failed', 'error');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome to ShiftPay</h1>
        <p className="text-gray-600 mb-8 text-center">
          Employee Attendance & Salary Management
        </p>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          useOneTap
        />
      </div>
    </div>
  );
};

export default Login;
