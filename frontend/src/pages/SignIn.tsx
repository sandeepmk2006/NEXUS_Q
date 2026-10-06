import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { Stethoscope, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../config/firebase';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';

const SPECIALIZATIONS = [
  'Radiology',
  'Pulmonology & Respiratory',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'General Medicine',
  'Emergency Medicine',
  'Pathology',
  'Internal Medicine',
  'Pediatrics',
  'Other Specialization',
];

const SignIn: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

  // Sign up doctor credentials state
  const [signupForm, setSignupForm] = useState({
    specialization: 'Radiology',
    licenseNumber: '',
    hospital: '',
    phone: '',
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignupForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      try {
        const response = await api.post('/auth/signin', { idToken });
        const userData = response.data.user;

        setUser(userData);
        toast.success(`Welcome, Dr. ${userData.displayName || userData.email}`);
        const destination = (location.state as any)?.from?.pathname || (userData.role === 'admin' ? '/admin' : '/dashboard');
        navigate(destination, { replace: true });
      } catch (backendErr: any) {
        if (backendErr.response?.data?.needsRegistration) {
          toast('No doctor profile found. Please complete the Sign Up tab.', { icon: 'ℹ️' });
          setTab('signup');
        } else {
          toast.error(backendErr.response?.data?.error || 'Unable to authenticate with server.');
        }
      }
    } catch (firebaseErr: any) {
      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in popup was closed.');
      } else if (firebaseErr.code === 'auth/cancelled-popup-request') {
        // User opened multiple popups; silently ignore
      } else {
        toast.error(firebaseErr.message || 'Google authentication error.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Doctor Sign Up Handler
  const handleDoctorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupForm.licenseNumber.trim()) {
      toast.error('Please enter your Medical License Number.');
      return;
    }
    if (!signupForm.hospital.trim()) {
      toast.error('Please enter your Hospital or Clinic name.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.post('/auth/register', {
        idToken,
        displayName: result.user.displayName || 'Doctor',
        specialization: signupForm.specialization,
        licenseNumber: signupForm.licenseNumber.trim(),
        hospital: signupForm.hospital.trim(),
        phone: signupForm.phone.trim(),
      });

      const userData = response.data.user;
      setUser(userData);
      toast.success('Doctor account created successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign up popup was closed.');
      } else {
        toast.error(err.response?.data?.error || err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold tracking-tight text-white">Tetrix</span>
            <span className="text-2xl font-bold tracking-tight text-blue-400">AI</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 uppercase tracking-widest font-medium">
          A Doctor Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#1e293b] py-8 px-6 shadow-xl rounded-2xl border border-slate-700/60 sm:px-10">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                tab === 'login'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                tab === 'signup'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up (Doctors)
            </button>
          </div>

          {/* TAB 1: LOG IN */}
          {tab === 'login' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Welcome Back</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access your clinical workspace and patient diagnostics.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-semibold shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  New doctor? Register here <ArrowRight className="inline w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {tab === 'signup' && (
            <form onSubmit={handleDoctorSignUp} className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Doctor Registration</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your medical credentials to initialize your clinical account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Specialization *
                </label>
                <select
                  name="specialization"
                  value={signupForm.specialization}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec} className="bg-slate-900">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Medical License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={signupForm.licenseNumber}
                  onChange={handleSignupChange}
                  placeholder="e.g. MD-482019"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Hospital / Clinic *
                </label>
                <input
                  type="text"
                  name="hospital"
                  value={signupForm.hospital}
                  onChange={handleSignupChange}
                  placeholder="e.g. Apollo Hospitals"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Direct Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={signupForm.phone}
                  onChange={handleSignupChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-semibold shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </Button>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Already have an account? Log In
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-[11px] text-slate-500">
            TetrixAI • Clinical Diagnostic Assistant
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
