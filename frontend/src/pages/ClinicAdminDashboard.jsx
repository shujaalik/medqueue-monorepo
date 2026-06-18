import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, LogOut, Plus, ShieldCheck, MapPin, Clock, Building2, ChevronRight, LayoutDashboard, Download, HeartPulse, Activity, Wand2
} from 'lucide-react';

const ClinicAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analyticsSubTab, setAnalyticsSubTab] = useState('traffic');

  // Data State
  const [stats, setStats] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Modals & Forms
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'Doctor' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.clinicId) {
      fetchClinicData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchClinicData = async () => {
    setLoading(true);
    setAiLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };

      // Fetch stats, staff list, clinic details and AI summary
      const [statsRes, staffRes, clinicRes, aiRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/${user.clinicId}`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clinics`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/ai-summary/${user.clinicId}`, { headers }).catch(e => ({ data: null }))
      ]);

      setStats(statsRes.data);
      if (aiRes && aiRes.data) {
        setAiAnalysis(aiRes.data);
      }

      // Filter staff list to only show staff in our clinic and exclude admins/superadmins for security
      const clinicStaff = staffRes.data.filter(s => s.clinicId === user.clinicId);
      setStaff(clinicStaff);

      // Find the specific clinic metadata
      const activeClinic = clinicRes.data.find(c => c._id === user.clinicId);
      setClinic(activeClinic);
    } catch (err) {
      console.error('Error fetching clinic executive data:', err);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const payload = {
        ...staffForm,
        clinicId: user.clinicId // Strictly enforce current clinic ID
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, payload, { headers });

      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'Doctor' });
      await fetchClinicData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering new practitioner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle`, {}, { headers });
      await fetchClinicData();
    } catch (err) {
      alert('Error toggling staff status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4fbf7] flex items-center justify-center">
        <div className="flex flex-col items-center space-x-2">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-black text-emerald-800 uppercase tracking-widest">Loading Executive Dashboard...</span>
        </div>
      </div>
    );
  }

  // Prepped Chart Colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const hourlyData = stats?.hourlyData || [];
  const outcomeData = stats?.summary ? [
    { name: 'Completed Sessions', value: stats.summary.completed, color: '#10b981' },
    { name: 'Active In Queue', value: stats.summary.waiting, color: '#3b82f6' },
    { name: 'Absent Sessions', value: stats.summary.absent, color: '#f59e0b' },
    { name: 'Cancelled Sessions', value: stats.summary.cancelled, color: '#ef4444' }
  ] : [];

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-emerald-100/50 flex flex-col justify-between p-8">
        <div className="space-y-12">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/10">
              <HeartPulse size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Med<span className="text-emerald-500">Queue</span></h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Executive Panel</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <Activity size={16} />
              <span>Metrics & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'staff'
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <Users size={16} />
              <span>Practitioners & Staff</span>
            </button>
          </nav>
        </div>

        {/* Profile Card / Logout */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col space-y-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Executive</p>
            <h4 className="text-sm font-black text-slate-800 tracking-tight mt-0.5">{user.name}</h4>
            <p className="text-slate-500 text-xs font-medium truncate mt-0.5">{user.email}</p>
          </div>
          {clinic && (
            <div className="pt-3 border-t border-slate-200/60 flex items-center space-x-2 text-slate-400">
              <Building2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase truncate tracking-wider">{clinic.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200/80 rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-emerald-100/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === 'analytics' ? 'Clinic Metrics & Performance' : 'Clinical Staff Management'}
            </h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              {clinic ? `${clinic.name} • ${clinic.address}` : 'Enterprise Clinic Operations'}
            </p>
          </div>
          {activeTab === 'staff' && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-2xl shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Plus size={16} />
              <span>Add Staff Account</span>
            </button>
          )}
        </header>

        {/* Tab 1: Analytics Sub-Panel */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xl shadow-slate-900/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registrations</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight mt-1">{stats.summary.totalVisits}</h3>
              </div>
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xl shadow-slate-900/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Completed Visits</p>
                <h3 className="text-4xl font-black text-emerald-600 tracking-tight mt-1">{stats.summary.completed}</h3>
              </div>
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xl shadow-slate-900/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-500">Absent / Cancelled</p>
                <h3 className="text-4xl font-black text-red-500 tracking-tight mt-1">{stats.summary.absent + stats.summary.cancelled}</h3>
              </div>
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xl shadow-slate-900/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-teal-600">Avg Serving Duration</p>
                <h3 className="text-4xl font-black text-teal-600 tracking-tight mt-1">{stats.summary.avgConsultation}m</h3>
              </div>
            </div>

            {/* Sub-Tabs for charts */}
            <div className="flex border-b border-emerald-100/50 space-x-8 text-xs uppercase font-black tracking-widest text-slate-400">
              <button
                onClick={() => setAnalyticsSubTab('traffic')}
                className={`pb-4 border-b-2 transition-all ${analyticsSubTab === 'traffic' ? 'border-emerald-600 text-emerald-600' : 'border-transparent hover:text-slate-700'}`}
              >
                Traffic Flow Analysis
              </button>
              <button
                onClick={() => setAnalyticsSubTab('outcomes')}
                className={`pb-4 border-b-2 transition-all ${analyticsSubTab === 'outcomes' ? 'border-emerald-600 text-emerald-600' : 'border-transparent hover:text-slate-700'}`}
              >
                Queue Session Outcomes
              </button>
              <button
                onClick={() => setAnalyticsSubTab('doctors')}
                className={`pb-4 border-b-2 transition-all ${analyticsSubTab === 'doctors' ? 'border-emerald-600 text-emerald-600' : 'border-transparent hover:text-slate-700'}`}
              >
                Practitioner Workload
              </button>
              <button
                onClick={() => setAnalyticsSubTab('aiReport')}
                className={`pb-4 border-b-2 transition-all flex items-center space-x-1.5 ${analyticsSubTab === 'aiReport' ? 'border-emerald-600 text-emerald-600' : 'border-transparent hover:text-slate-700'}`}
              >
                <span>AI Disease & Health Trends</span>
              </button>
            </div>

            {/* Traffic Flow Graph */}
            {analyticsSubTab === 'traffic' && (
              <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Patient Volume by Hour</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Outcome Donut Chart */}
            {analyticsSubTab === 'outcomes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 lg:col-span-2 flex flex-col justify-center items-center">
                  <h3 className="text-sm font-black text-slate-800 mb-6 self-start uppercase tracking-wider">Session Resolution Summary</h3>
                  <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={outcomeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {outcomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-black text-slate-800 leading-none">{stats.summary.totalVisits}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total visits</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 flex flex-col justify-between">
                  <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Outcomes Ledger</h3>
                  <div className="space-y-4 flex-1">
                    {outcomeData.map((outcome, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: outcome.color }}></div>
                          <span className="font-extrabold text-sm text-slate-700">{outcome.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-800 text-base">{outcome.value}</span>
                          <span className="text-slate-400 text-xs font-bold ml-1.5">
                            ({stats.summary.totalVisits > 0 ? Math.round((outcome.value / stats.summary.totalVisits) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Speed / Workload */}
            {analyticsSubTab === 'doctors' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 lg:col-span-2">
                  <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Practitioner Performance Table</h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-50/50 border-b border-emerald-100/40">
                          <th className="p-4.5 text-[9px] font-black text-emerald-800 uppercase tracking-wider">Practitioner</th>
                          <th className="p-4.5 text-[9px] font-black text-emerald-800 uppercase tracking-wider text-center">Patients Served</th>
                          <th className="p-4.5 text-[9px] font-black text-emerald-800 uppercase tracking-wider text-center">Avg Session speed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {stats.doctorData?.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4.5 font-extrabold text-slate-800">Dr. {doc.doctorName}</td>
                            <td className="p-4.5 text-center font-black text-slate-700">{doc.patientsServed}</td>
                            <td className="p-4.5 text-center font-black text-emerald-600">{doc.avgDuration} minutes</td>
                          </tr>
                        ))}
                        {(!stats.doctorData || stats.doctorData.length === 0) && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 italic">No doctor workload logged.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5">
                  <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Patient Volume by Doctor</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.doctorData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                        <XAxis dataKey="doctorName" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="patientsServed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {analyticsSubTab === 'aiReport' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {aiLoading ? (
                  <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 space-y-6 animate-pulse">
                    <div className="h-6 w-1/3 bg-slate-100 rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="h-32 bg-slate-50 rounded-2xl"></div>
                      <div className="h-32 bg-slate-50 rounded-2xl"></div>
                      <div className="h-32 bg-slate-50 rounded-2xl"></div>
                    </div>
                    <div className="h-20 bg-slate-50 rounded-2xl"></div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Disease trends list (left 2 cols) */}
                    <div className="lg:col-span-2 bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 flex flex-col">
                      <div className="flex items-center space-x-2.5 mb-6">
                        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-center">
                          <HeartPulse size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Top Diagnosed Medical Conditions</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Identified via Recent Consultation Records</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                        {aiAnalysis.topDiseases?.map((d, idx) => (
                          <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-150 transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Rank #{idx + 1}</span>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{d.count} Cases</span>
                              </div>
                              <h4 className="text-base font-black text-slate-800 tracking-tight leading-snug">{d.disease}</h4>
                              <p className="text-slate-500 font-medium text-[11px] mt-2.5 leading-relaxed">{d.description}</p>
                            </div>
                          </div>
                        ))}
                        {(!aiAnalysis.topDiseases || aiAnalysis.topDiseases.length === 0) && (
                          <div className="col-span-3 py-16 text-center text-slate-400 italic">No disease metrics detected yet. Populate case records to generate statistics.</div>
                        )}
                      </div>

                      {/* Severity Mix Pills */}
                      {aiAnalysis.severityDistribution && (
                        <div className="mt-8 bg-emerald-50/40 border border-emerald-100 p-4.5 rounded-2xl flex items-center space-x-3.5">
                          <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md flex-shrink-0">Clinical Severity Breakdown</span>
                          <p className="text-emerald-950 font-bold text-xs leading-relaxed">{aiAnalysis.severityDistribution}</p>
                        </div>
                      )}
                    </div>

                    {/* AI Scribe insights panel (right 1 col) */}
                    <div className="bg-white border border-emerald-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/5 flex flex-col">
                      <div className="flex items-center space-x-2.5 mb-6">
                        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-center">
                          <Wand2 size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">AI Epidemiological Insights</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Clinic Administration Advice</p>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1">
                        {aiAnalysis.aiInsights?.map((insight, idx) => (
                          <div key={idx} className="bg-emerald-50/15 border border-emerald-100/30 p-4.5 rounded-2xl flex items-start space-x-3">
                            <div className="bg-emerald-50 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-slate-600 font-semibold text-xs leading-relaxed mt-0.5">{insight}</p>
                          </div>
                        ))}
                        {(!aiAnalysis.aiInsights || aiAnalysis.aiInsights.length === 0) && (
                          <div className="py-12 text-center text-slate-400 italic">No administrative recommendations currently available.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-20 rounded-[2.5rem] border border-emerald-100 text-center text-slate-400 italic">
                    Failed to load AI trend analytics report.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Staff Sub-Panel */}
        {activeTab === 'staff' && (
          <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-950/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Active Clinic Staff Accounts</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Status</th>
                    <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-5 font-black text-slate-700">{member.name}</td>
                      <td className="p-5 font-bold text-slate-500">{member.email}</td>
                      <td className="p-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.role === 'Doctor'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`flex items-center text-[10px] font-black uppercase tracking-wider ${member.isActive !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                          <ShieldCheck size={14} className="mr-1.5" /> {member.isActive !== false ? 'ACTIVE CREDENTIALS' : 'SUSPENDED CREDENTIALS'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to ${member.isActive !== false ? 'suspend' : 'activate'} ${member.name}?`)) {
                              handleToggleUserStatus(member._id);
                            }
                          }}
                          className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all border ${
                            member.isActive !== false 
                              ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100' 
                              : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {member.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 italic">No registered staff. Create an account to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Staff Registration Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-1">Add Practitioner / Staff</h3>
            <p className="text-slate-400 text-xs font-semibold mb-6">Create credentials for a Doctor or Receptionist in this location.</p>

            <form onSubmit={handleAddStaff} className="space-y-5">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Conan"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-4.5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. doctor@medqueue.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-4.5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full px-4.5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Role Type</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-4.5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Receptionist">Receptionist</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="w-1/2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors border border-slate-200/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-1/2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-emerald-600/20'}`}
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isSubmitting ? 'Creating...' : 'Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicAdminDashboard;
