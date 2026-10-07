import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  ScanLine,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  assignedDoctorId: string;
  assignedDoctorName?: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  status?: string;
  createdAt: string;
  lastAnalysisAt?: string;
}

const PatientList: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New Patient Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodType: 'O+',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/admin/patients' : '/patients';
      const response = await api.get(endpoint);
      setPatients(response.data.patients || []);
    } catch (err: any) {
      toast.error('Failed to load patient roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [isAdmin]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      toast.error('Patient name and age are required.');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        bloodType: formData.bloodType,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        medicalHistory: formData.medicalHistory.trim(),
        allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : [],
        currentMedications: formData.currentMedications
          ? formData.currentMedications.split(',').map((s) => s.trim())
          : [],
      };

      await api.post('/patients', payload);
      toast.success(`Patient record initialized for ${formData.name}`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        bloodType: 'O+',
        phone: '',
        email: '',
        address: '',
        medicalHistory: '',
        allergies: '',
        currentMedications: '',
      });
      fetchPatients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not register patient record.');
    } finally {
      setCreating(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.assignedDoctorName?.toLowerCase().includes(q) ||
      p.bloodType?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  return (
    <Layout title="Patient Management">
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{isAdmin ? 'System Patient Directory' : 'My Patients'}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'All patients registered across clinical departments'
                : 'Medical records under your direct clinical supervision'}
            </p>
          </div>

          {!isAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, assigned doctor, blood group..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {/* Patients Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-600">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading patient records...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto opacity-30 text-slate-600" />
              <p className="text-base font-medium text-slate-700">No patient records found</p>
              <p className="text-xs max-w-sm mx-auto">
                {searchQuery
                  ? 'No patient matches your search query.'
                  : 'Start by registering your first patient to run multimodal diagnostic analysis.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <th className="py-3.5 px-5">Patient Name</th>
                    <th className="py-3.5 px-4">Demographics</th>
                    <th className="hidden sm:table-cell py-3.5 px-4">Blood Group</th>
                    {isAdmin && <th className="py-3.5 px-4">Attending Doctor</th>}
                    <th className="hidden md:table-cell py-3.5 px-4">Last Analysis</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-blue-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-5 min-w-[9rem]">
                        <div className="font-semibold text-slate-900">{patient.name}</div>
                        {patient.phone && (
                          <div className="text-xs text-slate-600">{patient.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {patient.age} yrs • {patient.gender}
                      </td>
                      <td className="hidden sm:table-cell py-3.5 px-4">
                        <Badge variant="info">{patient.bloodType || 'N/A'}</Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-medium text-blue-600">
                            {patient.assignedDoctorName || 'Dr. Assigned'}
                          </span>
                        </td>
                      )}
                      <td className="hidden md:table-cell py-3.5 px-4 text-xs text-slate-600">
                        {patient.lastAnalysisAt
                          ? new Date(patient.lastAnalysisAt).toLocaleDateString()
                          : 'No scan on file'}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Record
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            navigate('/analysis/new', { state: { patientId: patient.id } })
                          }
                          className="text-xs"
                        >
                          <ScanLine className="w-3.5 h-3.5 mr-1" />
                          Analyze Image
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Patient Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register New Patient"
          size="lg"
        >
          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Eleanor Vance"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 54"
                    required
                    min="0"
                    max="125"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="patient@mail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical History / Baseline Conditions
              </label>
              <textarea
                name="medicalHistory"
                rows={2}
                value={formData.medicalHistory}
                onChange={handleInputChange}
                placeholder="Prior surgeries, hypertension, chronic lung conditions..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="e.g. Penicillin, Latex, Contrast dye"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Medications (comma-separated)
                </label>
                <input
                  type="text"
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  placeholder="e.g. Lisinopril 10mg, Metformin 500mg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={creating}>
                Save Patient Record
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default PatientList;
