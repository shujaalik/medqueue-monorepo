import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Phone, CheckCircle2, ChevronRight, HeartPulse, Stethoscope } from 'lucide-react';

const SelfRegister = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', symptoms: '', notificationType: 'WhatsApp' });
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
      <div className="min-h-screen bg-[#f4fbf7] text-slate-800 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-100 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-emerald-100 p-6 rounded-full shadow-xl shadow-emerald-200 mb-8 animate-bounce flex items-center justify-center border border-emerald-200">
          <CheckCircle2 size={48} className="text-emerald-600" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-slate-800 tracking-tight">You're in the Queue!</h1>
        <p className="text-slate-500 font-semibold mb-8 text-sm">Your token has been generated successfully.</p>

        <div className="bg-white border border-emerald-100 p-10 rounded-[2.5rem] w-full max-w-sm mb-10 shadow-xl shadow-emerald-950/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Token Number</p>
          <p className="text-8xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">{registeredToken.token}</p>
          <div className="mt-8 pt-6 border-t border-emerald-50">
            <p className="text-sm font-bold text-slate-600">Expected Time: <span className="text-emerald-600 font-extrabold">{registeredToken.expectedTime}</span></p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/status/${clinicId}/${registeredToken.token}`)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/10 flex items-center group"
        >
          Track Live Status <ChevronRight className="ml-2 group-hover:translate-x-1.5 transition-transform" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-emerald-100 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HeartPulse className="text-emerald-500 animate-pulse" size={32} />
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Med<span className="text-emerald-500">Queue</span></h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-700 mb-1.5">{clinic?.name || 'Clinic Registration'}</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Queue Self-Registration</p>
        </div>

        <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-950/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Full Name</label>
              <div className="relative group">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl py-4.5 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Phone Number (WhatsApp)</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0300-1234567"
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl py-4.5 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm placeholder-slate-400"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Symptoms / Chief Complaint</label>
              <div className="relative group">
                <Stethoscope className="absolute left-4 top-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <textarea
                  placeholder="e.g. Cough, high fever, chest tightness..."
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-sm min-h-[100px] placeholder-slate-400"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2.5 ml-1 italic font-semibold">* MedQueue AI triage automatically flags urgent emergency cases.</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 group flex items-center justify-center"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isSubmitting ? 'Joining...' : 'Get My Token'}</span>
                </span>
                {!isSubmitting && <ChevronRight className="ml-1.5 group-hover:translate-x-0.5 transition-transform" size={18} />}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-12 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
          &copy; 2026 MedQueue Systems &bull; Safe & Secure Triage
        </p>
      </div>
    </div>
  );
};

export default SelfRegister;
