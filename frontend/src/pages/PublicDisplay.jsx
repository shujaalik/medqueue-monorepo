import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { HeartPulse, Clock, Coffee } from 'lucide-react';

const PublicDisplay = () => {
  const { clinicId } = useParams();
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null, isBreak: false });

  useEffect(() => {
    const queueRef = ref(db, `queues/${clinicId}`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      console.log("data: ", `queues/${clinicId}`)
      if (data) {
        setQueue({
          activeTokens: data.activeTokens ? Object.values(data.activeTokens).filter(Boolean) : [],
          currentServing: data.currentServing || null,
          isBreak: data.isBreak || false
        });
      }
    });
    return () => unsubscribe();
  }, [clinicId]);

  if (!clinicId) {
    return (
      <div className="min-h-screen bg-[#04120c] flex items-center justify-center text-white">
        <p className="text-2xl font-bold">Error: No Clinic ID provided in URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030f0a] text-slate-100 overflow-hidden flex flex-col select-none relative">
      {/* Break Overlay */}
      {queue.isBreak && (
        <div className="absolute inset-0 z-50 bg-[#020906]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-orange-500 p-12 rounded-[3rem] shadow-2xl shadow-orange-500/20 mb-10 border border-orange-400">
            <Coffee size={120} className="text-white animate-bounce" />
          </div>
          <h1 className="text-8xl font-black mb-6 tracking-tighter text-white">Doctor is on a Break</h1>
          <p className="text-4xl text-slate-400 font-bold max-w-4xl leading-tight">
            Consultations will resume shortly. Please maintain your tokens and stay nearby. Thank you!
          </p>
          <div className="mt-20 flex items-center space-x-4 text-orange-500 font-black text-2xl uppercase tracking-[0.3em]">
            <HeartPulse className="animate-pulse" />
            <span>MedQueue Live Sync</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-8 border-b border-[#0b2419] flex justify-between items-center bg-[#04120c]/60 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <HeartPulse className="text-emerald-400 w-12 h-12 animate-pulse" />
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Med<span className="text-emerald-400">Queue</span></h1>
            <p className="text-[#0d6e42] font-black uppercase tracking-widest text-[10px] mt-0.5">Live Display System</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-mono font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-0">
        {/* Left: Now Serving (Big) */}
        <div className="col-span-8 flex flex-col items-center justify-center border-r border-[#0b2419] bg-gradient-to-br from-[#04120c] to-[#020b07] relative">
          <div className="absolute top-12 text-[#0d6e42] font-black text-3xl uppercase tracking-[0.4em] animate-pulse">
            Now Serving
          </div>

          {queue.currentServing ? (
            <div className="flex flex-col items-center">
              <div className="text-[26rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_80px_rgba(16,185,129,0.35)]">
                {queue.currentServing.token}
              </div>
              <div className="text-6xl font-black text-slate-300 -mt-10 uppercase tracking-widest">
                {queue.currentServing.name}
              </div>
            </div>
          ) : (
            <div className="text-5xl font-black text-[#1b3d2b] uppercase animate-pulse">
              Awaiting Next Patient...
            </div>
          )}
        </div>

        {/* Right: Upcoming Tokens */}
        <div className="col-span-4 bg-[#030d08]/90 flex flex-col">
          <div className="p-10 border-b border-[#0b2419] bg-[#04120c]/40">
            <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
              <Clock className="mr-4 text-emerald-400" size={32} />
              Up Next
            </h2>
          </div>
          <div className="flex-1 divide-y divide-[#0b2419] overflow-y-auto">
            {queue.activeTokens.slice(0, 5).map((p) => (
              <div key={p.token} className="p-10 flex items-center justify-between group hover:bg-[#04120c]/40 transition-all">
                <div className="flex items-center space-x-8">
                  <span className="text-6xl font-black text-slate-500 group-hover:text-emerald-400 transition-colors">
                    {p.token}
                  </span>
                  <span className="text-4xl font-bold text-slate-300 truncate max-w-[200px]">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  {p.isEmergency ? (
                    <span className={`text-base font-black px-4 py-2 rounded-2xl border animate-pulse ${
                      p.severityScore >= 8 
                        ? "bg-gradient-to-r from-red-600 to-rose-950 text-white border-red-500 shadow-lg shadow-red-500/40" 
                        : p.severityScore >= 5 
                          ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400 shadow-md shadow-orange-500/30" 
                          : "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-300 shadow-sm shadow-amber-500/20"
                    }`}>
                      EMERGENCY (L{p.severityScore || 5})
                    </span>
                  ) : (
                    <span className="bg-[#0b2419] text-emerald-400 text-2xl font-mono font-black px-4 py-2 rounded-xl border border-[#0d6e42]/30">
                      {p.expectedTime || '--:--'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {queue.activeTokens.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-[#1b3d2b] italic text-2xl py-32">
                Queue is clear
              </div>
            )}
          </div>
          <footer className="p-10 bg-emerald-600 text-white text-center font-black text-2xl uppercase tracking-widest border-t border-emerald-500 shadow-2xl">
            Please have tokens ready
          </footer>
        </div>
      </main>
    </div>
  );
};

export default PublicDisplay;
