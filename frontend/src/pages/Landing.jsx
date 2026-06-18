import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, ClipboardList, Monitor, ChevronRight, HeartPulse, Search, 
  Zap, CheckCircle2, ShieldAlert, Users, Calendar, ArrowRight, BarChart3, Bot
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showClinicInput, setShowClinicInput] = useState(false);
  const [clinicId, setClinicId] = useState('665b1c8f42cf53da6e719541');
  const [targetPath, setTargetPath] = useState('');
  const [clinics, setClinics] = useState([
    { _id: '665b1c8f42cf53da6e719541', name: 'MedQueue Central Clinic' }
  ]);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/queue/clinics`);
        if (res.data && res.data.length > 0) {
          setClinics(res.data);
          const savedId = localStorage.getItem('lastClinicId');
          if (savedId && res.data.some(c => c._id === savedId)) {
            setClinicId(savedId);
          } else {
            setClinicId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching clinics list:', err);
      }
    };
    fetchClinics();

    const savedId = localStorage.getItem('lastClinicId');
    if (savedId) {
      setClinicId(savedId);
    }
  }, []);

  const portals = [
    { 
      name: 'Patient Live Tracker', 
      icon: User, 
      color: 'bg-emerald-500 text-white shadow-emerald-500/20', 
      path: '/status', 
      type: 'input', 
      desc: 'Check your real-time queue position and estimated wait time.' 
    },
    { 
      name: 'Lobby TV Display', 
      icon: Monitor, 
      color: 'bg-teal-500 text-white shadow-teal-500/20', 
      path: '/display', 
      type: 'input', 
      desc: 'Open the full-screen queue display for lobby and waiting rooms.' 
    },
    { 
      name: 'Clinical Staff Portal', 
      icon: ClipboardList, 
      color: 'bg-slate-700 text-white shadow-slate-700/20', 
      path: '/login', 
      type: 'direct', 
      desc: 'Login for MedQueue Super Admins, Clinic Executives, Doctors, and Receptionists.' 
    },
  ];

  const handleAction = (portal) => {
    if (portal.type === 'input') {
      setTargetPath(portal.path);
      setShowClinicInput(true);
    } else {
      navigate(portal.path);
    }
  };

  const handleGo = () => {
    if (clinicId.trim()) {
      localStorage.setItem('lastClinicId', clinicId.trim());
      if (targetPath === '/status') {
        alert('Patients should use the unique link sent to them via SMS/WhatsApp for live tracking. To test, append patient token to status URL.');
        navigate(`${targetPath}/${clinicId.trim()}/T-101`);
      } else {
        navigate(`${targetPath}/${clinicId.trim()}`);
      }
      setShowPortalModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-800 relative overflow-hidden font-sans">
      {/* Background aesthetic blobs & tech grid lines */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/70 rounded-full blur-[140px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100/60 rounded-full blur-[140px] animate-pulse delay-1000 pointer-events-none"></div>
      
      {/* Abstract Tech Grid Lines Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2f5ec_1px,transparent_1px),linear-gradient(to_bottom,#e2f5ec_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none"></div>

      {/* Glass Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-emerald-100/40 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-600/10 flex items-center justify-center">
            <HeartPulse size={20} className="animate-pulse" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800">
            Med<span className="text-emerald-500">Queue</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-500">
          <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
          <a href="#about" className="hover:text-emerald-600 transition-colors">Smart Co-Pilot</a>
          <a href="#performance" className="hover:text-emerald-600 transition-colors">Enterprise</a>
        </nav>
        <button 
          onClick={() => { setShowPortalModal(true); setShowClinicInput(false); }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95"
        >
          Launch Portal
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-6">
          <Zap className="text-emerald-600 w-4 h-4 animate-bounce" />
          <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Enterprise Clinic Scribe & Queue System</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-800 max-w-4xl mx-auto leading-[1.08] mb-8">
          The Intelligent Backbone of <span className="text-emerald-600 relative inline-block">Modern Clinics</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
          MedQueue coordinates patient arrivals, empowers doctors with context-aware AI medical scribing, and provides segregated multi-tenant analytics for clinic operations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <button 
            onClick={() => { setShowPortalModal(true); setShowClinicInput(false); }}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all text-sm uppercase tracking-wider flex items-center justify-center group"
          >
            Enter Platform Portals <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#features"
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-8 py-5 rounded-2xl transition-all text-sm uppercase tracking-wider flex items-center justify-center"
          >
            Explore Platform Features
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features" className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-emerald-100/50 shadow-lg shadow-slate-900/5 hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bot size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">AI Clinical Scribe Co-Pilot</h3>
            <p className="text-slate-500 font-semibold text-xs leading-relaxed">
              Expand short clinical notes instantly into detailed diagnoses, prescriptions, and advice. Discuss modifications in real-time with our contextual co-pilot.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-emerald-100/50 shadow-lg shadow-slate-900/5 hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Segregated Analytics</h3>
            <p className="text-slate-500 font-semibold text-xs leading-relaxed">
              Super-Admin dashboards view total enterprise operations, while specialized Clinic Admins view metrics, manage staff, and run performance audit checks strictly for their own clinic.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-emerald-100/50 shadow-lg shadow-slate-900/5 hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Live Waiting Room Sync</h3>
            <p className="text-slate-500 font-semibold text-xs leading-relaxed">
              Patients receive a dynamic URL on WhatsApp/SMS to track waiting times, while lobby display screens update instantly to maintain complete waiting-room transparency.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100/50 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          <div>&copy; 2026 MedQueue Systems &bull; Next-Gen Clinical Suite</div>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span>HIPAA Compliant</span>
            <span>Gemini LLM Enhanced</span>
            <span>Real-time DB Sync</span>
          </div>
        </div>
      </footer>

      {/* Portal Selection Glassmorphism Modal */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-emerald-100 shadow-2xl p-8 md:p-10 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Launch Portal</h2>
                <p className="text-slate-400 text-xs font-semibold mt-1">Select the MedQueue entry point or enter your clinic coordinates.</p>
              </div>
              <button 
                onClick={() => setShowPortalModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2.5 rounded-full border border-slate-100 hover:bg-slate-100 transition-all font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {!showClinicInput ? (
              <div className="space-y-4">
                {portals.map((portal) => (
                  <button
                    key={portal.name}
                    onClick={() => handleAction(portal)}
                    className="w-full group flex items-center p-5 bg-[#fcfdfd] border border-slate-100 hover:bg-white hover:border-emerald-300 rounded-2xl transition-all duration-300 text-left shadow-sm hover:shadow-md"
                  >
                    <div className={`${portal.color} p-4 rounded-xl mr-5 group-hover:scale-105 transition-transform`}>
                      <portal.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{portal.name}</h4>
                      <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed max-w-md">{portal.desc}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-all">
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-[#fcfdfd] p-6 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={() => setShowClinicInput(false)}
                  className="text-slate-400 hover:text-slate-600 mb-5 font-black flex items-center text-[10px] uppercase tracking-widest"
                >
                  <ChevronRight className="rotate-180 mr-1" size={14} /> Back
                </button>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  {showManualInput ? 'Enter Clinic ID' : 'Select Clinic Location'}
                </h3>
                <p className="text-slate-400 text-xs font-semibold mb-6">
                  {showManualInput 
                    ? 'Enter your 24-character hex Clinic ID from your registration records.'
                    : 'Select the branch location you want to access or track.'}
                </p>
                
                <div className="relative mb-4">
                  {!showManualInput ? (
                    <>
                      <select 
                        value={clinicId}
                        onChange={(e) => setClinicId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 px-6 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm shadow-sm cursor-pointer appearance-none animate-in fade-in duration-300"
                      >
                        <option value="">Select Clinic Location...</option>
                        {clinics.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4.5 text-slate-400">
                        <ChevronRight className="rotate-90" size={16} />
                      </div>
                    </>
                  ) : (
                    <div className="animate-in fade-in duration-300">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="e.g. 665b1c8f42cf53da6e719541"
                        value={clinicId}
                        onChange={(e) => setClinicId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-12 pr-4 text-slate-700 font-mono focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm font-bold shadow-inner"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end mb-6 mr-1">
                  <button 
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-emerald-600 hover:text-emerald-500 font-black text-[9px] uppercase tracking-wider transition-colors"
                  >
                    {showManualInput ? 'Or select from list' : 'Or enter Clinic ID manually'}
                  </button>
                </div>

                <button 
                  onClick={handleGo}
                  disabled={!clinicId.trim()}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${
                    clinicId.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Confirm and Redirect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
