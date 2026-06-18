import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, LogOut, Plus, ShieldCheck, MapPin, Clock, Building2, ChevronRight, LayoutDashboard, Settings, Download, HeartPulse, PieChart as PieIcon, Activity, Wand2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analyticsSubTab, setAnalyticsSubTab] = useState('traffic');

  // Data State
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: '', address: '', operatingHours: '', averageConsultationTime: 15 });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'Doctor', clinicId: '' });
  const [clinicSubmitting, setClinicSubmitting] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAIAnalysis = async (clinicId) => {
    setAiLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/ai-summary/${clinicId}`, { headers });
      setAiAnalysis(res.data);
    } catch (err) {
      console.error('Error fetching AI clinical trends:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      fetchClinicStats(selectedClinicId);
      fetchAIAnalysis(selectedClinicId);
    }
  }, [selectedClinicId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const [clinicsRes, staffRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clinics`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers })
      ]);
      setClinics(clinicsRes.data);
      setStaff(staffRes.data);

      if (clinicsRes.data.length > 0) {
        setSelectedClinicId(clinicsRes.data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoading(false);
    }
  };

  const fetchClinicStats = async (clinicId) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/${clinicId}`, { headers });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching clinic stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClinic = async (e) => {
    e.preventDefault();
    setClinicSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/clinics`, clinicForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowClinicModal(false);
      setClinicForm({ name: '', address: '', operatingHours: '', averageConsultationTime: 15 });
      fetchAllData();
    } catch (err) {
      alert('Error creating clinic');
    } finally {
      setClinicSubmitting(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, staffForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'Doctor', clinicId: '' });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding staff');
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/toggle`, {}, { headers });
      fetchAllData();
    } catch (err) {
      alert('Error toggling staff status');
    }
  };

  const handleExportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    const clinicName = clinics.find(c => c._id === selectedClinicId)?.name || 'Clinic';

    // Page 1: Summary Statistics & Doctor Performance
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Clinical Green
    doc.text("MedQueue Detailed Clinical Report", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Clinic: ${clinicName}`, 20, 28);
    doc.text(`Clinic ID: ${selectedClinicId}`, 20, 33);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 130, 28);

    doc.setDrawColor(200, 230, 210);
    doc.line(20, 37, 190, 37);

    doc.setFontSize(14);
    doc.setTextColor(5, 150, 94);
    doc.text("1. Overall Summary Statistics", 20, 47);

    const summaryData = [
      ["Metric", "Value", "Description"],
      ["Total Patient Visits", stats.summary.totalVisits.toString(), "Overall number of check-ins registered"],
      ["Completed Sessions", stats.summary.completed.toString(), "Patients fully served by doctors"],
      ["Waiting Patients", stats.summary.waiting.toString(), "Currently waiting in active queue"],
      ["Absent Patients", stats.summary.absent.toString(), "Patients called but noted absent"],
      ["Cancelled Sessions", stats.summary.cancelled.toString(), "Tokens revoked or deleted"],
      ["Average Consultation", `${stats.summary.avgConsultation} minutes`, "Avg serving time per patient"]
    ];

    doc.autoTable({
      startY: 53,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    let currentY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 94);
    doc.text("2. Doctor Workload & Performance speed", 20, currentY);

    const doctorRows = stats.doctorData.map(d => [
      d.doctorName,
      d.patientsServed.toString(),
      `${d.avgDuration} mins`
    ]);

    doc.autoTable({
      startY: currentY + 6,
      head: [["Doctor Name", "Patients Served", "Avg Consultation speed"]],
      body: doctorRows.length > 0 ? doctorRows : [["No doctors active in history", "0", "0 mins"]],
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 94] }
    });

    // Page 2: Patient History Log
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("3. Recent Patient Consultations Log", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Last 10 patients registered at this clinic location.", 20, 26);

    const patientRows = stats.recentHistory.map(h => [
      h.patientName,
      h.tokenNumber,
      h.status,
      h.doctorName,
      h.consultationDuration ? `${h.consultationDuration}m` : '--',
      new Date(h.date).toLocaleDateString()
    ]);

    doc.autoTable({
      startY: 32,
      head: [["Patient", "Token", "Status", "Assigned Doctor", "Duration", "Date"]],
      body: patientRows.length > 0 ? patientRows : [["No history logged", "-", "-", "-", "-", "-"]],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // PDF Footer on Page 2
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This report is securely compiled by MedQueue clinical analytics platform.", 20, finalY);

    doc.save(`MedQueue_Clinical_Report_${clinicName.replace(/\s+/g, '_')}.pdf`);
  };

  const outcomePieData = stats ? [
    { name: 'Completed', value: stats.summary.completed, color: '#10b981' },
    { name: 'Absent', value: stats.summary.absent, color: '#f59e0b' },
    { name: 'Cancelled', value: stats.summary.cancelled, color: '#ef4444' },
    { name: 'Waiting', value: stats.summary.waiting, color: '#3b82f6' }
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="min-h-screen bg-[#f4fbf7] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-700 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-emerald-100 flex flex-col p-8 z-10 shadow-sm">
        <div className="flex items-center space-x-3 mb-12">
          <ShieldCheck className="text-emerald-500 w-10 h-10 shadow-sm" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin<span className="text-emerald-500">Hub</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' : 'hover:bg-emerald-50/50 text-slate-500 hover:text-emerald-700'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-black text-sm">Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('clinics')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'clinics' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' : 'hover:bg-emerald-50/50 text-slate-500 hover:text-emerald-700'}`}
          >
            <Building2 size={18} />
            <span className="font-black text-sm">Manage Clinics</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'staff' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' : 'hover:bg-emerald-50/50 text-slate-500 hover:text-emerald-700'}`}
          >
            <Users size={18} />
            <span className="font-black text-sm">Staff Directory</span>
          </button>
        </nav>

        <button onClick={logout} className="mt-auto flex items-center space-x-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-sm">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 relative z-0">
        <header className="flex justify-between items-center mb-10 border-b border-emerald-100/40 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">System Controller &bull; {user.name}</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setShowClinicModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-slate-200 shadow-sm flex items-center space-x-2">
              <Plus size={14} />
              <span>New Clinic</span>
            </button>
            <button onClick={() => setShowStaffModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/10 flex items-center space-x-2">
              <Plus size={14} />
              <span>Add Staff</span>
            </button>
          </div>
        </header>

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Clinic Dropdown & Export Controls */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100/50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <label className="text-slate-400 text-xs font-black uppercase tracking-widest flex-shrink-0">Selected Location:</label>
                <select
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 cursor-pointer"
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                >
                  {clinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              {stats && (
                <button
                  onClick={handleExportPDF}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-sm transition-all w-full md:w-auto justify-center"
                >
                  <Download size={14} />
                  <span>Export Detailed Report (PDF)</span>
                </button>
              )}
            </div>

            {stats ? (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Visits', val: stats.summary.totalVisits, color: 'text-slate-800' },
                    { label: 'Completed', val: stats.summary.completed, color: 'text-emerald-600' },
                    { label: 'Avg Wait Speed', val: stats.summary.avgConsultation + 'm', color: 'text-teal-600' },
                    { label: 'Cancellations', val: stats.summary.cancelled, color: 'text-red-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm hover:shadow-emerald-950/5 transition-all">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                      <p className={`text-4xl font-black tracking-tight ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>

                {/* Sub Tab Navigation for Analytics charts */}
                <div className="border-b border-emerald-100/80 flex space-x-6">
                  {[
                    { id: 'traffic', label: 'Peak Traffic & Hourly Busiest Times', icon: Activity },
                    { id: 'outcomes', label: 'Queue Outcome Divisions', icon: PieIcon },
                    { id: 'doctors', label: 'Doctor Workload Analysis', icon: Users },
                    { id: 'aiReport', label: 'AI Disease & Health Trends', icon: Wand2 },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAnalyticsSubTab(tab.id)}
                      className={`pb-4 text-xs font-black uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${analyticsSubTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      <tab.icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content 1: Peak Traffic */}
                {analyticsSubTab === 'traffic' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visits trend over 7 days */}
                    <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Patient Arrivals (Last 7 Days)</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.chartData}>
                            <defs>
                              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1fae5', borderRadius: '16px' }} />
                            <Area type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Peak arrival hours */}
                    <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Hourly Patient Arrivals Density</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1fae5', borderRadius: '16px' }} />
                            <Bar dataKey="visits" fill="#0d6e42" radius={[8, 8, 0, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 2: Queue Outcomes */}
                {analyticsSubTab === 'outcomes' && (
                  <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex justify-center h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={outcomePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {outcomePieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 pr-6">
                      <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider border-b pb-2">Status Division Breakdown</h3>
                      {outcomePieData.map((outcome, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: outcome.color }}></div>
                            <span className="font-extrabold text-sm text-slate-700">{outcome.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-800 text-base">{outcome.value}</span>
                            <span className="text-slate-400 text-xs font-bold ml-1.5">
                              ({Math.round((outcome.value / stats.summary.totalVisits) * 100)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab content 3: Doctor Workload */}
                {analyticsSubTab === 'doctors' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Workload Matrix Table */}
                    <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm lg:col-span-2">
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
                            {stats.doctorData.map((doc, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-4.5 font-extrabold text-slate-800">Dr. {doc.doctorName}</td>
                                <td className="p-4.5 text-center font-black text-slate-700">{doc.patientsServed}</td>
                                <td className="p-4.5 text-center font-black text-emerald-600">{doc.avgDuration} minutes</td>
                              </tr>
                            ))}
                            {stats.doctorData.length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400 italic">No doctor workload logged.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Workload Bar graph */}
                    <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Patient Volume by Doctor</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.doctorData}>
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
                      <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm space-y-6 animate-pulse">
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
                        <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm flex flex-col">
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
                            <div className="mt-8 bg-emerald-50/40 border border-emerald-100/50 p-4.5 rounded-2xl flex items-center space-x-3.5">
                              <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md flex-shrink-0">Clinical Severity Breakdown</span>
                              <p className="text-emerald-950 font-bold text-xs leading-relaxed">{aiAnalysis.severityDistribution}</p>
                            </div>
                          )}
                        </div>

                        {/* AI Scribe insights panel (right 1 col) */}
                        <div className="bg-white border border-emerald-100/50 p-8 rounded-[2rem] shadow-sm flex flex-col">
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
                      <div className="bg-white p-20 rounded-[2.5rem] border border-emerald-100/50 text-center text-slate-400 italic">
                        Failed to load AI trend analytics report.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-20 rounded-[2.5rem] border border-emerald-100/50 text-center text-slate-400 italic">
                No analytics logs found. Please check clinic registration status.
              </div>
            )}
          </div>
        )}

        {activeTab === 'clinics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {clinics.map((clinic) => (
              <div key={clinic._id} className="bg-white border border-emerald-100 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-950/5 hover:border-emerald-300 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 border border-emerald-100">
                    <Building2 size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Clinic ID</p>
                    <p className="text-[10px] font-mono font-bold text-slate-400">{clinic._id}</p>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{clinic.name}</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-slate-500 flex items-center text-xs font-semibold"><MapPin size={14} className="mr-2.5 text-slate-400" /> {clinic.address}</p>
                  <p className="text-slate-500 flex items-center text-xs font-semibold"><Clock size={14} className="mr-2.5 text-slate-400" /> {clinic.operatingHours}</p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex -space-x-3">
                    {staff.filter(s => s.clinicId === clinic._id).slice(0, 3).map((s, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {staff.filter(s => s.clinicId === clinic._id).length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                        +{staff.filter(s => s.clinicId === clinic._id).length - 3}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setSelectedClinicId(clinic._id); setActiveTab('analytics'); }}
                    className="text-emerald-600 font-black text-xs uppercase tracking-wider flex items-center group-hover:translate-x-1.5 transition-all"
                  >
                    View Details <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white border border-emerald-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-emerald-950/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-100/40">
                  <th className="p-6 text-[9px] font-black text-emerald-800 uppercase tracking-widest">Name</th>
                  <th className="p-6 text-[9px] font-black text-emerald-800 uppercase tracking-widest">Role</th>
                  <th className="p-6 text-[9px] font-black text-emerald-800 uppercase tracking-widest">Clinic Location</th>
                  <th className="p-6 text-[9px] font-black text-emerald-800 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-[9px] font-black text-emerald-800 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {staff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center font-black">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${s.role === 'Admin' ? 'bg-purple-50 border border-purple-100 text-purple-600' : s.role === 'Doctor' ? 'bg-blue-50 border border-blue-100 text-blue-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="p-6 font-bold text-slate-600">
                      {clinics.find(c => c._id === s.clinicId)?.name || 'Unassigned'}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="font-bold text-slate-500">{s.isActive ? 'Active' : 'Suspended'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to ${s.isActive ? 'suspend' : 'activate'} ${s.name}?`)) {
                            handleToggleUserStatus(s._id);
                          }
                        }}
                        className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all border ${
                          s.isActive 
                            ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {s.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Clinic Modal */}
      {showClinicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 border border-emerald-100 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Register New Clinic</h3>
            <form onSubmit={handleAddClinic} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hope Medical Center"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Street, City"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Operating Hours</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9 AM - 5 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                    value={clinicForm.operatingHours}
                    onChange={(e) => setClinicForm({ ...clinicForm, operatingHours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Avg Time (min)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm"
                    value={clinicForm.averageConsultationTime}
                    onChange={(e) => setClinicForm({ ...clinicForm, averageConsultationTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex space-x-4 pt-6 border-t border-slate-50 mt-6">
                <button type="button" onClick={() => setShowClinicModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all text-sm">Cancel</button>
                <button type="submit" disabled={clinicSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/10 text-sm flex items-center justify-center gap-2">
                  {clinicSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{clinicSubmitting ? 'Creating...' : 'Create Clinic'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 border border-emerald-100 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Add Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alex Mercer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. doctor@clinic.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Role</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm cursor-pointer"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Assign Clinic</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm cursor-pointer"
                    value={staffForm.clinicId}
                    onChange={(e) => setStaffForm({ ...staffForm, clinicId: e.target.value })}
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 pt-6 border-t border-slate-50 mt-6">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all text-sm">Cancel</button>
                <button type="submit" disabled={staffSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/10 text-sm flex items-center justify-center gap-2">
                  {staffSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{staffSubmitting ? 'Adding...' : 'Add User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
