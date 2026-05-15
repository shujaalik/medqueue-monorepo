import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Phone, CheckCircle2, ChevronRight, Activity, ArrowLeft } from 'lucide-react';

const SelfRegister = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', notificationType: 'WhatsApp' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredToken, setRegisteredToken] = useState(null);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/clinic/${clinicId}`);
        setClinic(data);
      } catch (err) {
        console.error('Error fetching clinic:', err);
      }
    };
    fetchClinic();
  }, [clinicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/register`, {
        ...formData,
        clinicId
      });
      setRegisteredToken(data);
    } catch (err) {
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredToken) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-500 p-6 rounded-full shadow-2xl shadow-emerald-500/20 mb-8 animate-bounce">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-4xl font-black mb-2">You're in the Queue!</h1>
        <p className="text-slate-400 font-medium mb-10">Your token has been generated successfully.</p>
        
        <div className="bg-slate-800/50 border border-slate-700 p-10 rounded-[3rem] w-full max-w-sm mb-12 backdrop-blur-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Token Number</p>
          <p className="text-8xl font-black text-emerald-400 tracking-tighter">{registeredToken.token}</p>
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <p className="text-sm font-bold text-slate-300">Expected Time: {registeredToken.expectedTime}</p>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/status/${clinicId}/${registeredToken.token}`)}
          className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary-900/20 flex items-center group"
        >
          Track Live Status <ChevronRight className="ml-2 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.15),transparent_50%)]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="text-primary-500" size={32} />
            <h1 className="text-3xl font-black tracking-tighter">Med<span className="text-primary-500">Queue</span></h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{clinic?.name || 'Clinic Registration'}</h2>
          <p className="text-slate-400 font-medium">Scan to Join the Queue</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Full Name</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-primary-500 transition-all shadow-inner"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Phone Number (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="tel"
                  required
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-primary-500 transition-all shadow-inner"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-primary-900/20 group"
              >
                {isSubmitting ? 'Joining...' : 'Get My Token'}
                {!isSubmitting && <ChevronRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-12 text-slate-500 text-xs font-bold uppercase tracking-widest">
          &copy; 2026 MedQueue Systems &bull; Safe & Secure
        </p>
      </div>
    </div>
  );
};

export default SelfRegister;
