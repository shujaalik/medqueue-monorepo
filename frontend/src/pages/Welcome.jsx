import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ClipboardList, Monitor, Stethoscope, ChevronRight, Activity, Search } from 'lucide-react';

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
    { name: 'Patient Status', icon: User, color: 'bg-sky-500', path: '/status', type: 'input' },
    { name: 'TV Display', icon: Monitor, color: 'bg-orange-500', path: '/display', type: 'input' },
    { name: 'Staff Login', icon: ClipboardList, color: 'bg-indigo-600', path: '/login', type: 'direct' },
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
        // For patient status, we also need a token. 
        // We'll redirect to a helper page or just show an alert for now.
        alert('Patients should use the link sent to them via WhatsApp for live tracking.');
      } else {
        navigate(`${targetPath}/${clinicId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="text-center z-10 mb-16">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Activity className="text-primary-500 w-12 h-12" />
          <h1 className="text-6xl font-black tracking-tighter">
            Med<span className="text-primary-500">Queue</span>
          </h1>
        </div>
        <p className="text-xl text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
          The future of clinical efficiency. Synchronize your queue, empower your staff, and wow your patients.
        </p>
      </div>

      {!showClinicInput ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => handleAction(role)}
              className="group flex flex-col items-center p-10 bg-slate-800/40 backdrop-blur-xl rounded-[3rem] border border-slate-700/50 hover:bg-slate-800/60 hover:border-primary-500/50 transition-all duration-500 shadow-2xl"
            >
              <div className={`${role.color} p-6 rounded-[2rem] text-white mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-xl`}>
                <role.icon size={48} />
              </div>
              <h3 className="text-2xl font-black mb-2">{role.name}</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Access Portal</p>
              <ChevronRight className="mt-6 text-slate-600 group-hover:text-primary-500 group-hover:translate-x-2 transition-all" />
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-lg bg-slate-800/60 backdrop-blur-2xl p-12 rounded-[3rem] border border-slate-700 shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setShowClinicInput(false)}
            className="text-slate-500 hover:text-white mb-8 font-bold flex items-center"
          >
            <ChevronRight className="rotate-180 mr-2" size={20} /> Back
          </button>
          <h2 className="text-3xl font-black mb-4">Enter Clinic ID</h2>
          <p className="text-slate-400 mb-8 font-medium">Please enter your 24-character Clinic ID to access the live display system.</p>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="e.g. 6a06e4d0..."
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-mono focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <button 
            onClick={handleGo}
            className="w-full bg-primary-600 hover:bg-primary-500 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary-900/20"
          >
            Proceed to Portal
          </button>
        </div>
      )}

      <div className="mt-24 z-10 text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px]">
        &copy; 2026 MedQueue Systems &bull; Enterprise Edition
      </div>
    </div>
  );
};

export default Welcome;
