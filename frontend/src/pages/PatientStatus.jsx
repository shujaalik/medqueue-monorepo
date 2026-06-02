import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import { HeartPulse, Clock, MapPin, ChevronLeft, Coffee } from 'lucide-react';

const PatientStatus = () => {
  const { clinicId, token } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null, isBreak: false });
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    // Fetch Clinic Details
    const fetchClinic = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/clinic/${clinicId}`);
        setClinic(data);
      } catch (err) {
        console.error('Error fetching clinic:', err);
      }
    };
    fetchClinic();

    const queueRef = ref(db, `queues/${clinicId}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setQueue({
          activeTokens: data.activeTokens || [],
          currentServing: data.currentServing || null,
          isBreak: data.isBreak || false
        });
      }
    });
    return () => unsubscribe();
  }, [clinicId]);

  const patient = queue.activeTokens.find(p => p.token === token);
  const position = queue.activeTokens.findIndex(p => p.token === token) + 1;
  const isServing = queue.currentServing?.token === token;

  // Calculate Progress percentage
  const progress = patient ? Math.max(10, 100 - (position * 15)) : 0;

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-100 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="w-full max-w-md flex items-center justify-between mb-8 z-10">
        <button onClick={() => navigate('/')} className="p-3 hover:bg-white rounded-2xl transition-colors border border-emerald-100/30 shadow-sm bg-white/50">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center space-x-2">
          <HeartPulse className="text-emerald-500 animate-pulse" size={24} />
          <span className="font-black text-slate-800 text-xl tracking-tight">Med<span className="text-emerald-500">Queue</span></span>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Status Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 p-10 relative overflow-hidden border border-emerald-100/50">
          {queue.isBreak && (
            <div className="bg-orange-500 text-white p-3 -mt-10 -mx-10 mb-8 flex items-center justify-center font-black text-[10px] uppercase tracking-widest">
              <Coffee size={14} className="mr-2 animate-bounce" />
              Doctor is on a short break
            </div>
          )}
          <div className="flex justify-center mb-8">
            {isServing ? (
              <span className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-bounce">
                Your Turn Now
              </span>
            ) : patient ? (
              <span className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                Waiting in Queue
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-400 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                Inactive Token
              </span>
            )}
          </div>

          <div className="text-center mb-10">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Your Token Number</p>
            <h2 className="text-8xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{token}</h2>
          </div>

          {patient ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f7fcf9] p-6 rounded-3xl text-center border border-emerald-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Position</p>
                  <p className="text-4xl font-black text-slate-800">#{position}</p>
                </div>
                <div className="bg-[#f7fcf9] p-6 rounded-3xl text-center border border-emerald-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Expected At</p>
                  <p className="text-3xl font-black text-emerald-600">{patient.expectedTime || '--:--'}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase px-1">
                  <span>Arrival</span>
                  <span className={isServing ? "text-emerald-600" : ""}>Consultation</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1.5 border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isServing ? 'bg-emerald-500' : 'bg-emerald-500 shadow-md shadow-emerald-200'}`}
                    style={{ width: isServing ? '100%' : `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400">
                <div className="flex items-center text-[9px] font-black uppercase tracking-wider">
                  <Clock size={12} className="mr-1.5 text-emerald-500" />
                  Live Syncing...
                </div>
                <div className="flex items-center text-[9px] font-black uppercase tracking-wider">
                  <HeartPulse size={12} className="mr-1.5 text-emerald-500" />
                  {patient.notificationType} Alerts On
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-6">
              <p className="text-slate-400 font-medium text-sm">This token is no longer active or was recently completed.</p>
              <button onClick={() => navigate('/')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all text-sm">
                Return to Home
              </button>
            </div>
          )}
        </div>

        {/* Clinic Info Card */}
        {clinic && (
          <div className="bg-white rounded-[2rem] p-8 border border-emerald-100/50 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Clinic Information</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="text-emerald-500 mt-1 mr-3" size={18} />
                <div>
                  <p className="text-sm font-bold text-slate-700">{clinic.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{clinic.address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="text-emerald-500 mr-3" size={18} />
                <p className="text-xs font-semibold text-slate-500">Open: {clinic.operatingHours}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-600 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-xl shadow-emerald-600/10">
          <div className="max-w-[200px]">
            <h4 className="font-black text-lg mb-1 leading-tight">Stay Notified!</h4>
            <p className="text-emerald-100 text-xs leading-relaxed font-semibold">
              We'll send a {patient?.notificationType || 'WhatsApp'} alert when you're 3rd in line.
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <HeartPulse className="animate-pulse w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientStatus;
