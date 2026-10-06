import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  ArrowRight,
  UserPlus,
  ScanLine,
  TrendingUp,
  Stethoscope,
  Shield,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

/* ─── Types ──────────────────────────────────────────────── */
interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  lastAnalysisDate?: string;
  status?: string;
  createdAt: string;
}

interface Analysis {
  _id: string;
  patientName: string;
  patientId: string;
  imageType: string;
  confidenceScore: number;
  createdAt: string;
  summary?: string;
}

interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalAnalyses: number;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const formatDate = (iso: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusVariant = (
  status?: string
): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'stable':
      return 'success';
    case 'critical':
      return 'danger';
    case 'monitoring':
      return 'warning';
    case 'new':
      return 'info';
    default:
      return 'default';
  }
};

const getConfidenceVariant = (
  score: number
): 'success' | 'warning' | 'danger' => {
  if (score >= 85) return 'success';
  if (score >= 65) return 'warning';
  return 'danger';
};

/* ─── Stat Card ───────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    violet: 'bg-violet-500/15 text-violet-400',
    amber: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] ?? colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton ────────────────────────────────────────────── */
const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-700/40 rounded-xl animate-pulse" />
    ))}
  </div>
);

/* ─── Dashboard ───────────────────────────────────────────── */
const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  /* ── Fetch patients ── */
  useEffect(() => {
    const endpoint = isAdmin ? '/admin/patients' : '/patients';
    api
      .get<Patient[]>(endpoint)
      .then((res) => setPatients(res.data))
      .catch(() => toast.error('Failed to load patients.'))
      .finally(() => setLoadingPatients(false));
  }, [isAdmin]);

  /* ── Fetch analyses ── */
  useEffect(() => {
    api
      .get<Analysis[]>('/analysis')
      .then((res) => setAnalyses(res.data))
      .catch(() => toast.error('Failed to load analyses.'))
      .finally(() => setLoadingAnalyses(false));
  }, []);

  /* ── Fetch admin stats ── */
  useEffect(() => {
    if (!isAdmin) return;
    api
      .get<AdminStats>('/admin/stats')
      .then((res) => setAdminStats(res.data))
      .catch(() => {
        /* non-critical */
      });
  }, [isAdmin]);

  const recentPatients = patients.slice(0, 5);
  const recentAnalyses = analyses.slice(0, 5);

  return (
    <Layout title="Dashboard">
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* ── Welcome Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-100">
                Welcome back, {user?.name?.split(' ')[0] ?? 'Doctor'}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30 text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{today}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/patients/new')}
            >
              <UserPlus className="w-4 h-4" />
              Add Patient
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/analysis/new')}
            >
              <ScanLine className="w-4 h-4" />
              Run AI Analysis
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        {isAdmin && adminStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Doctors"
              value={adminStats.totalDoctors}
              icon={Stethoscope}
              color="violet"
            />
            <StatCard
              label="Total Patients"
              value={adminStats.totalPatients}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Total Analyses"
              value={adminStats.totalAnalyses}
              icon={Activity}
              color="emerald"
            />
            <StatCard
              label="Recent Activity"
              value={recentAnalyses.length}
              icon={TrendingUp}
              color="amber"
              trend="Last 24 hours"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Patients"
              value={patients.length}
              icon={Users}
              color="blue"
              trend="All time"
            />
            <StatCard
              label="Total Analyses"
              value={analyses.length}
              icon={Activity}
              color="emerald"
              trend="All time"
            />
            <StatCard
              label="Recent Activity"
              value={recentAnalyses.length}
              icon={TrendingUp}
              color="amber"
              trend="Last 5 entries"
            />
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Patients Table */}
          <div className="lg:col-span-3 bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
              <h3 className="text-sm font-semibold text-slate-100">Recent Patients</h3>
              <button
                onClick={() => navigate('/patients')}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {loadingPatients ? (
                <div className="p-5">
                  <TableSkeleton />
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Users className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/40">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-3 py-3">Age</th>
                      <th className="text-left px-3 py-3">Gender</th>
                      <th className="text-left px-3 py-3">Last Analysis</th>
                      <th className="text-left px-3 py-3">Status</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {recentPatients.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-200">
                          {p.name}
                        </td>
                        <td className="px-3 py-3.5 text-slate-400">{p.age}</td>
                        <td className="px-3 py-3.5 text-slate-400 capitalize">
                          {p.gender}
                        </td>
                        <td className="px-3 py-3.5 text-slate-400">
                          {formatDate(p.lastAnalysisDate ?? '')}
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge variant={getStatusVariant(p.status)}>
                            {p.status ?? 'New'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <button
                            onClick={() => navigate(`/patients/${p._id}`)}
                            className="p-1 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            aria-label={`View ${p.name}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Analyses Feed */}
          <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
              <h3 className="text-sm font-semibold text-slate-100">Recent Analyses</h3>
              <button
                onClick={() => navigate('/analysis')}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="px-5 py-4">
              {loadingAnalyses ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-slate-700/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentAnalyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Activity className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No analyses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAnalyses.map((a) => (
                    <div
                      key={a._id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/analysis/${a._id}`)}
                    >
                      <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 flex-shrink-0">
                        <ScanLine className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {a.patientName}
                        </p>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">
                          {a.imageType}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant={getConfidenceVariant(a.confidenceScore)}>
                            {a.confidenceScore}% confidence
                          </Badge>
                          <span className="text-[10px] text-slate-600">
                            {formatDate(a.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
