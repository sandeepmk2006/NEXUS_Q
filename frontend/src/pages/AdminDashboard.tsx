import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Stethoscope,
  Activity,
  ArrowRightLeft,
  UserCheck,
  UserX,
  FileText,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../config/api';

interface DoctorUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  specialization?: string;
  hospital?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  assignedDoctorId: string;
  assignedDoctorName?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  patientId?: string;
  fromDoctorId?: string;
  toDoctorId?: string;
  performedBy: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'patients' | 'audits'>('doctors');
  const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, totalAnalyses: 0 });
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Search filter
  const [search, setSearch] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [sRes, dRes, pRes, aRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/doctors'),
        api.get('/admin/patients'),
        api.get('/admin/audit-logs'),
      ]);

      setStats(sRes.data.stats || { totalDoctors: 0, totalPatients: 0, totalAnalyses: 0 });
      setDoctors(dRes.data.doctors || []);
      setPatients(pRes.data.patients || []);
      setAudits(aRes.data.logs || []);
    } catch (err) {
      toast.error('Failed to load system admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleDoctorStatus = async (doctor: DoctorUser) => {
    const nextStatus = doctor.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/doctors/${doctor.id || doctor.uid}/status`, { status: nextStatus });
      toast.success(`Doctor ${doctor.displayName} marked as ${nextStatus}`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update status.');
    }
  };

  const openTransferModal = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setTargetDoctorId('');
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !targetDoctorId) {
      toast.error('Please choose a recipient physician.');
      return;
    }

    try {
      setTransferring(true);
      await api.patch(`/admin/patients/${selectedPatient.id}/transfer`, {
        targetDoctorId,
      });

      toast.success(`Patient record successfully transferred!`);
      setTransferModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setTransferring(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      d.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.assignedDoctorName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Layout title="System Administration">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="System Administration">
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-700" />
              <h2 className="text-xl font-bold text-slate-900">Superadmin Control Tower</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cross-department doctor management, patient reassignment, and audit surveillance
            </p>
          </div>
          <Badge variant="warning" className="px-3 py-1 font-semibold text-xs w-fit">
            Root Authority
          </Badge>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Registered Doctors</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDoctors}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Total Patient Charts</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalPatients}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-semibold">AI Scans Executed</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalAnalyses}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'doctors'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors ({doctors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'patients'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Patient Reassignment ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'audits'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail ({audits.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records in active tab..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        {/* Tab 1: Doctors */}
        {activeTab === 'doctors' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <th className="py-3.5 px-5">Doctor Name</th>
                    <th className="py-3.5 px-4">Specialization</th>
                    <th className="py-3.5 px-4">Affiliation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id || doc.uid} className="hover:bg-blue-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{doc.displayName}</div>
                        <div className="text-xs text-slate-600">{doc.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {doc.specialization || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {doc.hospital || 'Private Clinic'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={doc.status === 'active' ? 'success' : 'danger'}>
                          {doc.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant={doc.status === 'active' ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleDoctorStatus(doc)}
                          className="text-xs"
                        >
                          {doc.status === 'active' ? (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Suspend Access
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Reactivate
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Patients & Transfer */}
        {activeTab === 'patients' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <th className="py-3.5 px-5">Patient Name</th>
                    <th className="py-3.5 px-4">Demographics</th>
                    <th className="py-3.5 px-4">Current Assigned Doctor</th>
                    <th className="py-3.5 px-5 text-right">Reassign Physician</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-blue-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{pat.name}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {pat.age} yrs • {pat.gender} ({pat.bloodType || 'O+'})
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-600">
                          {pat.assignedDoctorName || 'Dr. Attending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openTransferModal(pat)}
                          className="text-xs hover:border-blue-500 hover:text-blue-700"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                          Transfer Patient
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Audits */}
        {activeTab === 'audits' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <th className="py-3.5 px-5">Event Action</th>
                    <th className="py-3.5 px-4">Patient / Subject</th>
                    <th className="py-3.5 px-4">Operator</th>
                    <th className="py-3.5 px-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {audits.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/60">
                      <td className="py-3.5 px-5">
                        <Badge variant="warning">{log.action}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                        {log.patientId ? `Patient #${log.patientId.slice(0, 8)}` : 'System Entity'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {log.performedBy.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reassignment Modal */}
        <Modal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title={`Reassign Patient: ${selectedPatient?.name}`}
          size="md"
        >
          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            <p className="text-xs text-slate-700">
              Transferring this patient will revoke access from{' '}
              <strong className="text-blue-600">{selectedPatient?.assignedDoctorName}</strong> and
              grant exclusive access to the target physician.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Target Physician *
              </label>
              <select
                value={targetDoctorId}
                onChange={(e) => setTargetDoctorId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors
                  .filter((d) => (d.id || d.uid) !== selectedPatient?.assignedDoctorId)
                  .map((d) => (
                    <option key={d.id || d.uid} value={d.id || d.uid}>
                      {d.displayName} ({d.specialization || 'General'}) - {d.hospital || 'Hospital'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={transferring}>
                Confirm Patient Transfer
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
