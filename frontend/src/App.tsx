import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './config/firebase';
import api from './config/api';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy Loaded Pages
const SignIn = lazy(() => import('./pages/SignIn'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientList = lazy(() => import('./pages/PatientList'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const NewAnalysis = lazy(() => import('./pages/NewAnalysis'));
const AnalysisReport = lazy(() => import('./pages/AnalysisReport'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

const App: React.FC = () => {
  const { setUser, setLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await api.post('/auth/signin', { idToken });
          setUser(response.data.user);
        } catch (error: any) {
          // If needs registration, leave user as null so they can register
          if (!error.response?.data?.needsRegistration) {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            fontSize: '13px',
          },
          duration: 4000,
        }}
      />
      <Suspense fallback={<LoadingSpinner message="Initializing TetrixAI..." />}>
        <Routes>
          {/* Public Authentication */}
          <Route
            path="/signin"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
              ) : (
                <SignIn />
              )
            }
          />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />

          {/* Protected Clinical Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <PatientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <Navigate to="/analysis/new" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/new"
            element={
              <ProtectedRoute>
                <NewAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <AnalysisReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
