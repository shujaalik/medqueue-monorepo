import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, HeartPulse } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'Admin' || user.role === 'SuperAdmin') navigate('/admin');
      else if (user.role === 'ClinicAdmin') navigate('/clinic-admin');
      else if (user.role === 'Doctor') navigate('/doctor');
      else if (user.role === 'Receptionist') navigate('/receptionist');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center medical-gradient p-6 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-300/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-10 border border-white/40 transition-all hover:shadow-emerald-950/5">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-emerald-50 p-4 rounded-3xl shadow-md mb-4 border border-emerald-100 flex items-center justify-center">
            <HeartPulse className="w-10 h-10 text-emerald-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Med<span className="text-emerald-500">Queue</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Clinical Portal</p>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 text-center text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200/80 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 bg-slate-50/30 text-slate-700 font-bold placeholder-slate-400 transition-all text-sm"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200/80 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 bg-slate-50/30 text-slate-700 font-bold placeholder-slate-400 transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
