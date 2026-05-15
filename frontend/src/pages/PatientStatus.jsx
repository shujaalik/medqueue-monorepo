import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { Activity, Clock, MapPin, ChevronLeft, Coffee } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <header className="w-full max-w-md flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white rounded-xl transition-colors">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Activity className="text-primary-600" size={24} />
          <span className="font-black text-slate-800 text-xl tracking-tight">MedQueue</span>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="w-full max-w-md space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary-900/10 p-10 relative overflow-hidden border border-slate-100">
          {queue.isBreak && (
            <div className="bg-orange-500 text-white p-3 -mt-10 -mx-10 mb-8 flex items-center justify-center font-black text-xs uppercase tracking-widest">
              <Coffee size={14} className="mr-2 animate-bounce" />
              Doctor is on a short break
            </div>
          )}
          <div className="flex justify-center mb-10">
            {isServing ? (
              <span className="bg-green-100 text-green-600 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest animate-bounce">
                Your Turn Now
              </span>
            ) : patient ? (
              <span className="bg-primary-50 text-primary-600 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">
                Waiting in Queue
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-400 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">
                Invalid Token
              </span>
            )}
          </div>

          <div className="text-center mb-12">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Your Token Number</p>
            <h2 className="text-8xl font-black text-slate-900 tracking-tighter">{token}</h2>
          </div>

          {patient ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Position</p>
                  <p className="text-4xl font-black text-slate-800">#{position}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Expected At</p>
                  <p className="text-3xl font-black text-primary-600">{patient.expectedTime || '--:--'}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase px-1">
                  <span>Arrival</span>
                  <span className={isServing ? "text-green-500" : ""}>Consultation</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1.5 border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isServing ? 'bg-green-500' : 'bg-primary-500 shadow-lg shadow-primary-200'}`}
                    style={{ width: isServing ? '100%' : `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400">
                <div className="flex items-center text-[10px] font-black uppercase tracking-wider">
                  <Clock size={14} className="mr-2" />
                  Live Syncing...
                </div>
                <div className="flex items-center text-[10px] font-black uppercase tracking-wider">
                  <Activity size={14} className="mr-2" />
                  {patient.notificationType} Alerts On
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-6">
              <p className="text-slate-500 font-medium">This token is no longer active or was recently completed.</p>
              <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg">
                Return to Home
              </button>
            </div>
          )}
        </div>

        {/* Clinic Info Card */}
        {clinic && (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Clinic Information</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="text-primary-500 mt-1 mr-3" size={18} />
                <div>
                  <p className="text-sm font-bold text-slate-700">{clinic.name}</p>
                  <p className="text-xs text-slate-400">{clinic.address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="text-primary-500 mr-3" size={18} />
                <p className="text-xs font-medium text-slate-500">Open: {clinic.operatingHours}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-indigo-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-200">
          <div className="max-w-[200px]">
            <h4 className="font-black text-lg mb-1">Stay Notified!</h4>
            <p className="text-indigo-100 text-xs leading-relaxed font-medium">
              We'll send a {patient?.notificationType || 'WhatsApp'} alert when you're 3rd in line.
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <Activity className="animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientStatus;
