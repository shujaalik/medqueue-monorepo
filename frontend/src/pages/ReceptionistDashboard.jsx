import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserPlus, Clock, AlertCircle, LogOut, CheckCircle2, Monitor, QrCode, Download } from 'lucide-react';
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
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/register`, {
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
    }
  };

  const markAbsent = async (token) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/absent`, 
        { clinicId: user.clinicId, token },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-primary-600 p-2 rounded-lg text-white">
            <UserPlus size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Reception Portal</h1>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all"
          >
            <QrCode size={18} />
            <span>Clinic QR Code</span>
          </button>
          <Link to={`/display/${user.clinicId}`} target="_blank" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-4 py-2 rounded-xl transition-all">
            <Monitor size={18} />
            <span>Open TV Display</span>
          </Link>
          <span className="text-slate-600 font-medium">Welcome, {user.name}</span>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Register Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <UserPlus className="mr-2 text-primary-500" size={20} />
              Register Patient
            </h2>
            
            {message && (
              <div className={`p-4 rounded-xl mb-6 text-sm flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {message.type === 'success' ? <CheckCircle2 className="mr-2" size={16} /> : <AlertCircle className="mr-2" size={16} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patient Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="03xx-xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergency"
                  className="w-5 h-5 text-red-500 border-slate-300 rounded focus:ring-red-500"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                />
                <label htmlFor="emergency" className="ml-3 text-sm font-bold text-red-600">Mark as Emergency</label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notification Alert</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 transition-all appearance-none bg-white"
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
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Generate Token
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Live Waiting List</h2>
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full">
                {queue.activeTokens.length} Waiting
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {queue.activeTokens.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                  No patients in the queue currently.
                </div>
              ) : (
                queue.activeTokens.map((p, index) => (
                  <div key={p.token} className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-colors ${p.isEmergency ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm ${p.isEmergency ? 'bg-red-500 text-white' : 'bg-primary-50 text-primary-700'}`}>
                        <span className="text-xs uppercase">Token</span>
                        <span className="text-lg leading-tight">{p.token}</span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-slate-800">{p.name}</h3>
                          {p.isEmergency && <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded">Emergency</span>}
                        </div>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Clock size={14} className="mr-1" />
                          {p.estimatedWait} mins wait • Arrived {new Date(p.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => markAbsent(p.token)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Self-Registration</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Patients can scan this to join the queue</p>
            
            <div 
              className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-center mb-8 cursor-pointer hover:bg-slate-100 transition-colors group relative"
              onClick={downloadQR}
              title="Click to Download QR Code"
            >
              <QRCodeCanvas 
                value={`${window.location.origin}/register/${user.clinicId}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-[2px] rounded-3xl transition-opacity">
                <Download className="text-slate-900" size={32} />
              </div>
            </div>

            <button 
              onClick={() => setShowQR(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all"
            >
              Close Window
            </button>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary-600" onClick={() => window.print()}>
              Print QR Code
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
