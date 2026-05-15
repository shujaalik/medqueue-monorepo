import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { Activity, Clock, Coffee } from 'lucide-react';

const PublicDisplay = () => {
  const { clinicId } = useParams();
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null, isBreak: false });

  useEffect(() => {
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

  if (!clinicId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-2xl font-bold">Error: No Clinic ID provided in URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden flex flex-col theme-medqueue">
      {/* Break Overlay */}
      {queue.isBreak && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-orange-500 p-12 rounded-[3rem] shadow-2xl shadow-orange-500/20 mb-10">
            <Coffee size={120} className="text-white animate-bounce" />
          </div>
          <h1 className="text-8xl font-black mb-6 tracking-tighter">Doctor is on a Break</h1>
          <p className="text-4xl text-slate-400 font-bold max-w-4xl leading-tight">
            Consultations will resume shortly. Please maintain your tokens and stay nearby. Thank you!
          </p>
          <div className="mt-20 flex items-center space-x-4 text-orange-500 font-black text-2xl uppercase tracking-[0.3em]">
            <Activity className="animate-pulse" />
            <span>MedQueue Live Sync</span>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Activity className="text-primary-400 w-12 h-12" />
          <div>
            <h1 className="text-4xl font-black tracking-tight">Med<span className="text-primary-400">Queue</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Live Display System</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-mono font-black text-slate-300">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-0">
        {/* Left: Now Serving (Big) */}
        <div className="col-span-8 flex flex-col items-center justify-center border-r border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 relative">
          <div className="absolute top-10 text-primary-400 font-black text-2xl uppercase tracking-[0.5em] animate-pulse">
            Now Serving
          </div>
          
          {queue.currentServing ? (
            <div className="flex flex-col items-center">
              <div className="text-[25rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_80px_rgba(14,165,233,0.3)]">
                {queue.currentServing.token}
              </div>
              <div className="text-6xl font-black text-slate-400 -mt-10 uppercase tracking-widest">
                {queue.currentServing.name}
              </div>
            </div>
          ) : (
            <div className="text-6xl font-black text-slate-700 uppercase animate-pulse">
              Waiting for next...
            </div>
          )}
        </div>

        {/* Right: Upcoming Tokens */}
        <div className="col-span-4 bg-slate-900/80 flex flex-col">
          <div className="p-10 border-b border-slate-800 bg-slate-800/30">
            <h2 className="text-3xl font-black text-slate-300 flex items-center">
              <Clock className="mr-4 text-primary-400" size={32} />
              Up Next
            </h2>
          </div>
          <div className="flex-1 divide-y divide-slate-800">
            {queue.activeTokens.slice(0, 5).map((p, idx) => (
              <div key={p.token} className="p-10 flex items-center justify-between group hover:bg-slate-800/50 transition-all">
                <div className="flex items-center space-x-8">
                  <span className="text-5xl font-black text-slate-600 group-hover:text-primary-400 transition-colors">
                    {p.token}
                  </span>
                  <span className="text-4xl font-bold text-slate-400 truncate max-w-[200px]">
                    {p.name}
                  </span>
                </div>
                {p.isEmergency && (
                  <span className="bg-red-900/50 text-red-400 text-sm font-black px-3 py-1 rounded-full border border-red-800 animate-bounce">
                    URGENT
                  </span>
                )}
              </div>
            ))}
            {queue.activeTokens.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-slate-600 italic text-2xl">
                Queue is clear
              </div>
            )}
          </div>
          <footer className="p-8 bg-primary-600 text-white text-center font-black text-xl uppercase tracking-widest">
            Please have your tokens ready
          </footer>
        </div>
      </main>
    </div>
  );
};

export default PublicDisplay;
