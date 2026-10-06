import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { Stethoscope, Shield, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../config/firebase';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';

const SignIn: React.FC = () => {
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loginMode, setLoginMode] = useState<'doctor' | 'admin'>('doctor');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();

  const handleGoogleSignIn = async (role: 'doctor' | 'admin') => {
    const isDoctor = role === 'doctor';
    if (isDoctor) setLoadingDoctor(true);
    else setLoadingAdmin(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      try {
        const response = await api.post('/auth/signin', { idToken });
        const userData = response.data.user;

        if (role === 'admin' && userData.role !== 'admin') {
          toast.error('This Google account is not configured as an administrator.');
          if (isDoctor) setLoadingDoctor(false);
          else setLoadingAdmin(false);
          return;
        }

        setUser(userData);
        toast.success(`Welcome back, Dr. ${userData.displayName || userData.email}!`);
        const from = (location.state as any)?.from?.pathname || (userData.role === 'admin' ? '/admin' : '/dashboard');
        navigate(from, { replace: true });
      } catch (backendErr: any) {
        if (backendErr.response?.data?.needsRegistration) {
          if (role === 'admin') {
            toast.error('Admin accounts cannot be registered through this portal. Please contact the system administrator.');
            return;
          }
          // Direct to Doctor Registration
          navigate('/register', {
            state: {
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              uid: result.user.uid,
            },
          });
          toast('Please complete your medical credentials to finish registration.', { icon: 'ℹ️' });
        } else {
          toast.error(backendErr.response?.data?.error || 'Authentication failed on server.');
        }
      }
    } catch (firebaseErr: any) {
      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in popup was closed.');
      } else {
        toast.error(firebaseErr.message || 'Google authentication failed.');
      }
    } finally {
      if (isDoctor) setLoadingDoctor(false);
      else setLoadingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">NEXUS</span>
            <span className="text-2xl font-bold tracking-tight text-blue-400">-Q</span>
          </div>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-200">
          Multimodal Medical Intelligence
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 max-w-sm mx-auto">
          Clinical Decision Support & High-Precision Medical Image Diagnostic Copilot
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#1e293b] py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => setLoginMode('doctor')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                loginMode === 'doctor'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor Portal
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                loginMode === 'admin'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Portal
            </button>
          </div>

          {loginMode === 'doctor' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Physician Access</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in or create a verified physician account using institutional Google authentication.
                </p>
              </div>

              <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Isolated patient medical records for your practice</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Sub-region image localization & confidence metrics</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Anti-hallucination evidence cross-referencing</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={loadingDoctor}
                onClick={() => handleGoogleSignIn('doctor')}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 py-3 font-semibold shadow-lg shadow-blue-600/25"
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
                Continue with Google
              </Button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">
                  New Doctor? Use the button above to register your credentials.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Administrator Console</h3>
                <p className="text-xs text-slate-400 mt-1">
                  System administrators manage doctor rosters, cross-department patient transfers, and system audits.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p>
                  No public registration exists for Admin accounts. Only pre-configured root administrators can access this view.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={loadingAdmin}
                onClick={() => handleGoogleSignIn('admin')}
                className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 py-3 font-semibold shadow-lg shadow-violet-600/25"
              >
                <Shield className="w-5 h-5 text-white" />
                Sign In as Administrator
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-slate-700/60 pt-4 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>NEXUS-Q Clinical Decision AI • HackNex 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
