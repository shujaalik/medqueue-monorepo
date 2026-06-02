import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserPlus, Clock, AlertCircle, LogOut, CheckCircle2, Monitor, QrCode, Download, HeartPulse } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const ReceptionistDashboard = () => {
  const { user, logout } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null });
  const [message, setMessage] = useState(null);
  const [notificationType, setNotificationType] = useState('WhatsApp');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [absentTokenLoading, setAbsentTokenLoading] = useState(null);

  useEffect(() => {
    if (!user?.clinicId) return;
    const queueRef = ref(db, `queues/${user.clinicId}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setQueue({
          activeTokens: data.activeTokens || [],
          currentServing: data.currentServing || null
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Registering patient for clinic:', user.clinicId);
    setRegisterLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/register`, {
        clinicId: user.clinicId,
        name,
        phone,
        isEmergency,
        notificationType
      });
      setName('');
      setPhone('');
      setIsEmergency(false);
      setMessage({ type: 'success', text: 'Token Generated Successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setMessage({ type: 'error', text: 'Failed to register patient' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const markAbsent = async (token) => {
    setAbsentTokenLoading(token);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/absent`,
        { clinicId: user.clinicId, token },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAbsentTokenLoading(null);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `Clinic_QR_${user.clinicId}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7]">
      <nav className="bg-white border-b border-emerald-100/50 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <UserPlus size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Reception<span className="text-emerald-500">Portal</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold border border-slate-200/60 transition-all text-xs"
          >
            <QrCode size={16} />
            <span>Clinic QR Code</span>
          </button>
          <Link to={`/display/${user.clinicId}`} target="_blank" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100/60 px-4 py-2.5 rounded-xl transition-all border border-emerald-100 text-xs">
            <Monitor size={16} />
            <span>Open TV Display</span>
          </Link>
          <div className="h-6 w-px bg-slate-200"></div>
          <span className="text-slate-600 text-sm font-bold">Welcome, {user.name}</span>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-50 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Register Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 p-8">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center tracking-tight border-b border-slate-50 pb-4">
              <UserPlus className="mr-3 text-emerald-500" size={22} />
              Register Patient
            </h2>

            {message && (
              <div className={`p-4 rounded-2xl mb-6 text-xs font-semibold flex items-center border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 animate-in fade-in' : 'bg-red-50 border-red-100 text-red-600 animate-in fade-in'}`}>
                {message.type === 'success' ? <CheckCircle2 className="mr-2 text-emerald-600 flex-shrink-0" size={16} /> : <AlertCircle className="mr-2 text-red-500 flex-shrink-0" size={16} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Patient Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 bg-slate-50/20 text-slate-700 font-bold placeholder-slate-400 transition-all text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 bg-slate-50/20 text-slate-700 font-bold placeholder-slate-400 transition-all text-sm"
                  placeholder="e.g. 03xx-xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-center p-3 bg-red-50/30 border border-red-100/50 rounded-2xl">
                <input
                  type="checkbox"
                  id="emergency"
                  className="w-5 h-5 text-red-500 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                />
                <label htmlFor="emergency" className="ml-3 text-xs font-black text-red-600 cursor-pointer uppercase tracking-wider">Mark as Emergency</label>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Notification Alert</label>
                <select
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 bg-white text-slate-700 font-bold transition-all text-sm appearance-none pr-8 cursor-pointer"
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="SMS">SMS Alert</option>
                  <option value="None">No Notification</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-all text-sm tracking-wide mt-2"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {registerLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{registerLoading ? 'Generating...' : 'Generate Token'}</span>
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-emerald-50/80 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                <HeartPulse className="text-emerald-500 mr-2 animate-pulse" size={20} />
                Live Waiting List
              </h2>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-4.5 py-1.5 rounded-full border border-emerald-200">
                {queue.activeTokens.length} Waiting
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
              {queue.activeTokens.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic text-sm font-medium">
                  No patients in the queue currently.
                </div>
              ) : (
                queue.activeTokens.map((p) => (
                  <div key={p.token} className={`p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${p.isEmergency ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm border ${p.isEmergency ? 'bg-red-500 border-red-600 text-white shadow-red-200' : 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-50'}`}>
                        <span className="text-[9px] uppercase tracking-wider opacity-90">Token</span>
                        <span className="text-lg leading-tight mt-0.5">{p.token}</span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-extrabold text-slate-800 text-base">{p.name}</h3>
                          {p.isEmergency && <span className="ml-2.5 bg-red-100 text-red-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-red-200">Emergency</span>}
                        </div>
                        <div className="flex items-center text-xs text-slate-400 mt-1 font-semibold">
                          <Clock size={12} className="mr-1 text-emerald-500" />
                          {p.estimatedWait} mins wait • Arrived {new Date(p.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markAbsent(p.token)}
                        disabled={absentTokenLoading === p.token}
                        className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          {absentTokenLoading === p.token && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                          <span>{absentTokenLoading === p.token ? 'Updating...' : 'Absent'}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )
                ))}
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in fade-in zoom-in duration-300 border border-emerald-100">
            <h3 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">Self-Registration</h3>
            <p className="text-slate-400 text-xs font-semibold mb-6 uppercase tracking-wider">Patients join via scan</p>

            <div
              className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex justify-center mb-8 cursor-pointer hover:bg-emerald-50 transition-colors group relative shadow-inner"
              onClick={downloadQR}
              title="Click to Download QR Code"
            >
              <QRCodeCanvas
                value={`${window.location.origin}/register/${user.clinicId}`}
                size={200}
                level="H"
                includeMargin={true}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-[2px] rounded-3xl transition-opacity">
                <Download className="text-emerald-700 bg-white p-3 rounded-full shadow-lg border border-emerald-100" size={48} />
              </div>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black transition-all text-sm"
            >
              Close Window
            </button>
            <p className="mt-4 text-[9px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest cursor-pointer transition-colors" onClick={() => window.print()}>
              Print QR Code Poster
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
