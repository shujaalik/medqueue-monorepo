import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ClipboardList, Monitor, ChevronRight, HeartPulse, Search } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [showClinicInput, setShowClinicInput] = useState(false);
  const [clinicId, setClinicId] = useState('');
  const [targetPath, setTargetPath] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem('lastClinicId');
    if (savedId) {
      setClinicId(savedId);
    }
  }, []);

  const roles = [
    { name: 'Patient Tracking', icon: User, color: 'bg-emerald-500 shadow-emerald-500/20', path: '/status', type: 'input', desc: 'Check your real-time queue position' },
    { name: 'Clinic TV Display', icon: Monitor, color: 'bg-teal-500 shadow-teal-500/20', path: '/display', type: 'input', desc: 'Open full-screen display for lobby' },
    { name: 'Staff Dashboard', icon: ClipboardList, color: 'bg-slate-700 shadow-slate-700/20', path: '/login', type: 'direct', desc: 'Login for doctors and receptionists' },
  ];

  const handleAction = (role) => {
    if (role.type === 'input') {
      setTargetPath(role.path);
      setShowClinicInput(true);
    } else {
      navigate(role.path);
    }
  };

  const handleGo = () => {
    if (clinicId.trim()) {
      localStorage.setItem('lastClinicId', clinicId.trim());
      if (targetPath === '/status') {
        alert('Patients should use the link sent to them via WhatsApp or SMS for live tracking.');
      } else {
        navigate(`${targetPath}/${clinicId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background soft blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-100 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-100/70 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="text-center z-10 mb-16 max-w-2xl">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <HeartPulse className="text-emerald-500 w-14 h-14 animate-pulse" />
          <h1 className="text-5xl font-black tracking-tight text-slate-800">
            Med<span className="text-emerald-500">Queue</span>
          </h1>
        </div>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">
          Synchronize clinical queues, elevate patient experience, and streamline medical operations.
        </p>
      </div>

      {!showClinicInput ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl z-10">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => handleAction(role)}
              className="group flex flex-col items-center p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-emerald-100/50 hover:bg-white hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-300 text-center"
            >
              <div className={`${role.color} p-5 rounded-2xl text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <role.icon size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{role.name}</h3>
              <p className="text-slate-400 text-xs font-semibold max-w-[200px] leading-relaxed mb-4">{role.desc}</p>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-colors">
                <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-md bg-white backdrop-blur-2xl p-10 rounded-[2.5rem] border border-emerald-100 shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setShowClinicInput(false)}
            className="text-slate-400 hover:text-slate-600 mb-6 font-bold flex items-center text-xs uppercase tracking-wider"
          >
            <ChevronRight className="rotate-180 mr-1.5" size={16} /> Back
          </button>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Enter Clinic ID</h2>
          <p className="text-slate-400 text-xs font-medium mb-6">Enter your 24-character Clinic ID to open the dashboard.</p>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="e.g. 6a06e4d0..."
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-mono focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm font-bold"
            />
          </div>

          <button 
            onClick={handleGo}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20"
          >
            Proceed to Portal
          </button>
        </div>
      )}

      <div className="mt-20 z-10 text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px]">
        &copy; 2026 MedQueue Systems &bull; Enterprise Health Edition
      </div>
    </div>
  );
};

export default Welcome;
