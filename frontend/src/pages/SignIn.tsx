import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Stethoscope, ArrowRight, ExternalLink } from 'lucide-react';
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

  // Check for redirect result on page mount
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        setLoading(true);
        const idToken = await result.user.getIdToken();

        // Check if registration was pending
        const pending = sessionStorage.getItem('tetrix_pending_signup');
        if (pending) {
          sessionStorage.removeItem('tetrix_pending_signup');
          const regData = JSON.parse(pending);
          try {
            const res = await api.post('/auth/register', {
              idToken,
              displayName: result.user.displayName || 'Doctor',
              ...regData,
            });
            setUser(res.data.user);
            toast.success('Doctor account created successfully.');
            navigate('/dashboard', { replace: true });
            return;
          } catch (regErr: any) {
            toast.error(regErr.response?.data?.error || 'Registration failed.');
          }
        }

        // Standard Sign In
        try {
          const res = await api.post('/auth/signin', { idToken });
          setUser(res.data.user);
          toast.success(`Welcome, Dr. ${res.data.user.displayName || res.data.user.email}`);
          navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        } catch (backendErr: any) {
          if (backendErr.response?.data?.needsRegistration) {
            toast('No doctor profile found. Please complete the Sign Up tab.', { icon: 'ℹ️' });
            setTab('signup');
          } else {
            toast.error(backendErr.response?.data?.error || 'Unable to authenticate with server.');
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect auth check:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignupForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Google Login Handler (Popup with auto-fallback to Redirect)
  const handleGoogleLogin = async (useRedirectMode = false) => {
    setLoading(true);
    if (useRedirectMode) {
      toast('Redirecting to Google...', { icon: '🔄' });
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      try {
        const response = await api.post('/auth/signin', { idToken });
        const userData = response.data.user;

        setUser(userData);
        toast.success(`Welcome, Dr. ${userData.displayName || userData.email}`);
        const destination =
          (location.state as any)?.from?.pathname ||
          (userData.role === 'admin' ? '/admin' : '/dashboard');
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
      if (firebaseErr.code === 'auth/popup-blocked' || firebaseErr.code === 'auth/popup-closed-by-user') {
        toast('Popup was blocked by browser. Switching to redirect sign-in...', { icon: '🔄' });
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      toast.error(firebaseErr.message || 'Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Google Doctor Sign Up Handler (Popup with auto-fallback to Redirect)
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
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        sessionStorage.setItem(
          'tetrix_pending_signup',
          JSON.stringify({
            specialization: signupForm.specialization,
            licenseNumber: signupForm.licenseNumber.trim(),
            hospital: signupForm.hospital.trim(),
            phone: signupForm.phone.trim(),
          })
        );
        toast('Popup blocked. Redirecting to Google to finish registration...', { icon: '🔄' });
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      toast.error(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-blue-700 text-white px-14 py-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">TetrixAI</span>
        </div>

        <div className="space-y-10 max-w-md">
          {/* The product in one picture: a region on a scan, with its confidence */}
          <div className="relative h-52 rounded-lg bg-blue-900/60 border border-white/15 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_55%,rgba(255,255,255,0.16),transparent_55%),radial-gradient(ellipse_at_72%_50%,rgba(255,255,255,0.10),transparent_50%)]" />
            <div className="absolute left-[16%] top-[34%] w-[26%] h-[40%] border-2 border-amber-300">
              <span className="absolute -top-6 left-[-2px] whitespace-nowrap bg-amber-300 text-blue-950 text-[11px] font-semibold px-1.5 py-0.5">
                Finding 1: 87% confidence
              </span>
            </div>
            <div className="absolute right-[14%] top-[40%] w-[20%] h-[30%] border-2 border-white/70" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              A second opinion on every scan.
            </h1>
            <p className="text-blue-100 leading-relaxed">
              Upload an image with the patient&apos;s notes. TetrixAI outlines what it sees, says how
              sure it is, and leaves the decision to you.
            </p>
          </div>
        </div>

        <p className="text-sm text-blue-200 max-w-md">
          Decision support for qualified clinicians. It does not replace clinical judgment.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">TetrixAI</span>
          </div>

        <div>
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                tab === 'login'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                tab === 'signup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up (Doctors)
            </button>
          </div>

          {/* TAB 1: LOG IN */}
          {tab === 'login' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Welcome Back</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Access your clinical workspace and patient diagnostics.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onClick={() => handleGoogleLogin(false)}
                className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 hover:bg-blue-700 text-sm font-semibold shadow-sm"
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

              <div className="flex flex-col items-center gap-2 pt-1 text-center">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(true)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Browser blocking popups? Sign in via Redirect</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-xs text-slate-600 hover:text-blue-700 transition-colors mt-1"
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
                <h3 className="text-base font-semibold text-slate-900">Doctor Registration</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Enter your medical credentials to initialize your clinical account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization *
                </label>
                <select
                  name="specialization"
                  value={signupForm.specialization}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec} className="bg-slate-50">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={signupForm.licenseNumber}
                  onChange={handleSignupChange}
                  placeholder="e.g. MD-482019"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Clinic *
                </label>
                <input
                  type="text"
                  name="hospital"
                  value={signupForm.hospital}
                  onChange={handleSignupChange}
                  placeholder="e.g. Apollo Hospitals"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={signupForm.phone}
                  onChange={handleSignupChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-sm font-semibold shadow-sm"
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
                  className="text-xs text-slate-600 hover:text-blue-700 transition-colors"
                >
                  Already have an account? Log In
                </button>
              </div>
            </form>
          )}

        </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
