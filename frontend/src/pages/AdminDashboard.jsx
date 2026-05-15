import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, Activity, LogOut, Plus, ShieldCheck, MapPin, Clock, Building2, ChevronRight, LayoutDashboard, Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Data State
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: '', address: '', operatingHours: '', averageConsultationTime: 15 });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'Doctor', clinicId: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

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
      
      // Fetch stats for the first clinic if available
      if (clinicsRes.data.length > 0) {
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/${clinicsRes.data[0]._id}`, { headers });
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClinic = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/clinics`, clinicForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowClinicModal(false);
      setClinicForm({ name: '', address: '', operatingHours: '', averageConsultationTime: 15 });
      fetchAllData();
    } catch (err) {
      alert('Error creating clinic');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, staffForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'Doctor', clinicId: '' });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding staff');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col p-8">
        <div className="flex items-center space-x-3 mb-12">
          <ShieldCheck className="text-primary-500 w-10 h-10" />
          <h1 className="text-2xl font-black text-white tracking-tighter">Admin<span className="text-primary-500">Hub</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'analytics' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-bold">Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('clinics')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'clinics' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Building2 size={20} />
            <span className="font-bold">Manage Clinics</span>
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'staff' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Users size={20} />
            <span className="font-bold">Staff Directory</span>
          </button>
        </nav>

        <button onClick={logout} className="mt-auto flex items-center space-x-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={20} />
          <span className="font-bold">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black text-white capitalize">{activeTab}</h2>
            <p className="text-slate-500 mt-1 font-medium">Welcome back, {user.name}</p>
          </div>
          <div className="flex space-x-4">
            <button onClick={() => setShowClinicModal(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all border border-slate-700">
              <Plus size={18} />
              <span>New Clinic</span>
            </button>
            <button onClick={() => setShowStaffModal(true)} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-primary-900/20">
              <Plus size={18} />
              <span>Add Staff</span>
            </button>
          </div>
        </header>

        {activeTab === 'analytics' && stats && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Visits', val: stats.summary.totalVisits, color: 'text-white' },
                { label: 'Completed', val: stats.summary.completed, color: 'text-green-400' },
                { label: 'Avg Wait', val: stats.summary.avgConsultation + 'm', color: 'text-primary-400' },
                { label: 'Cancellations', val: stats.summary.cancelled, color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] hover:border-slate-700 transition-all">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem]">
              <h3 className="text-xl font-bold text-white mb-8">Patient Traffic (Last 7 Days)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                    <Area type="monotone" dataKey="visits" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clinics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {clinics.map((clinic) => (
              <div key={clinic._id} className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] hover:border-primary-500/30 transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-primary-600/10 p-4 rounded-2xl text-primary-500">
                    <Building2 size={32} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic ID</p>
                    <p className="text-xs font-mono text-slate-400">{clinic._id}</p>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{clinic.name}</h3>
                <div className="space-y-3 mb-8">
                  <p className="text-slate-400 flex items-center text-sm font-medium"><MapPin size={16} className="mr-3 text-slate-600" /> {clinic.address}</p>
                  <p className="text-slate-400 flex items-center text-sm font-medium"><Clock size={16} className="mr-3 text-slate-600" /> {clinic.operatingHours}</p>
                </div>
                <div className="pt-8 border-t border-slate-800 flex justify-between items-center">
                  <div className="flex -space-x-3">
                    {staff.filter(s => s.clinicId === clinic._id).slice(0, 3).map((s, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#0a0c10] flex items-center justify-center text-[10px] font-bold">
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {staff.filter(s => s.clinicId === clinic._id).length > 3 && (
                      <div className="w-10 h-10 rounded-full bg-primary-600 border-2 border-[#0a0c10] flex items-center justify-center text-[10px] font-bold">
                        +{staff.filter(s => s.clinicId === clinic._id).length - 3}
                      </div>
                    )}
                  </div>
                  <button className="text-primary-500 font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform">
                    View Details <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic</th>
                  <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.role === 'Admin' ? 'bg-purple-900/30 text-purple-400' : s.role === 'Doctor' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="p-8 text-sm font-medium text-slate-400">
                      {clinics.find(c => c._id === s.clinicId)?.name || 'Unassigned'}
                    </td>
                    <td className="p-8">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-bold text-slate-400">{s.isActive ? 'Active' : 'Suspended'}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <Settings size={20} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg p-12 border border-slate-700 animate-in fade-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-white mb-8">Register New Clinic</h3>
            <form onSubmit={handleAddClinic} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hope Medical Center"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({...clinicForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Street, City"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm({...clinicForm, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operating Hours</label>
                  <input
                    type="text"
                    required
                    placeholder="9 AM - 5 PM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={clinicForm.operatingHours}
                    onChange={(e) => setClinicForm({...clinicForm, operatingHours: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Avg Time (min)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={clinicForm.averageConsultationTime}
                    onChange={(e) => setClinicForm({...clinicForm, averageConsultationTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setShowClinicModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary-900/20">Create Clinic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg p-12 border border-slate-700 animate-in fade-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-white mb-8">Add Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Role</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Assign Clinic</label>
                  <select
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white focus:border-primary-500 outline-none transition-colors"
                    value={staffForm.clinicId}
                    onChange={(e) => setStaffForm({...staffForm, clinicId: e.target.value})}
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary-900/20">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
