import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Building2, Award, Phone, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
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

const Register: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const stateData = (location.state as any) || {};

  const [formData, setFormData] = useState({
    displayName: stateData.displayName || '',
    specialization: 'Radiology',
    licenseNumber: '',
    hospital: '',
    phone: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.licenseNumber.trim() || !formData.hospital.trim()) {
      toast.error('Please fill in your medical license and hospital affiliation.');
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Session expired. Please sign in with Google again.');
        navigate('/signin');
        return;
      }

      const idToken = await currentUser.getIdToken(true);

      const response = await api.post('/auth/register', {
        idToken,
        displayName: formData.displayName.trim() || currentUser.displayName || 'Physician',
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber.trim(),
        hospital: formData.hospital.trim(),
        phone: formData.phone.trim(),
      });

      setUser(response.data.user);
      toast.success('Doctor account created successfully! Welcome to NEXUS-Q.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
            <span className="text-xl font-bold tracking-tight text-blue-400">-Q</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-100">
          Physician Verification & Setup
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Complete your clinical profile to initialize your patient diagnostic workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#1e293b] py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Legal Name / Clinical Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Smith, MD"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Clinical Specialization
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec} className="bg-slate-900">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* License Number & Hospital Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Medical License / Reg No.
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. MD-982314-X"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hospital / Institution
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="e.g. Metro General Hospital"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Department / Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 font-semibold"
              >
                <span>Complete Registration & Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
