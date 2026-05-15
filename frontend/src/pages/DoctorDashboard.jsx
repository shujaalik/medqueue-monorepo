import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Play, SkipForward, Users, Clock, LogOut, CheckCircle, Timer, 
  Coffee, Zap, Wand2, FileText, Activity, Pill, HeartPulse, Info, HelpCircle, Keyboard, Download
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null, isBreak: false });
  const [elapsed, setElapsed] = useState(0);
  
  // AI Notes State
  const [shorthand, setShorthand] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.clinicId) return;
    const queueRef = ref(db, `queues/${user.clinicId}`);
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
  }, [user]);

  // Timer logic
  useEffect(() => {
    if (queue.currentServing) {
      const start = new Date(queue.currentServing.startTime).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
      setShorthand('');
      setExpandedNotes(null);
    }
    return () => clearInterval(timerRef.current);
  }, [queue.currentServing]);

  const callNext = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/next`, 
        { clinicId: user.clinicId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error calling next patient');
    }
  };

  const handleFinish = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/finish`, 
        { clinicId: user.clinicId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert('Error finishing session');
    }
  };

  const handleToggleBreak = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/break`, 
        { clinicId: user.clinicId, isBreak: !queue.isBreak },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert('Error toggling break');
    }
  };

  const handleExpandNotes = async () => {
    if (!shorthand.trim()) return;
    setIsExpanding(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/expand-notes`, 
        { shorthand },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setExpandedNotes(data.expanded);
    } catch (err) {
      console.error('AI Expansion failed', err);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleExpandNotes();
    }
  };

  const downloadPDF = () => {
    if (!expandedNotes || !queue.currentServing) return;
    
    const doc = new jsPDF();
    const patient = queue.currentServing;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("MedQueue Medical Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Clinic ID: ${user.clinicId}`, 20, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);
    
    // Patient Info
    doc.line(20, 32, 190, 32);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Patient Name: ${patient.name}`, 20, 42);
    doc.text(`Token: ${patient.token}`, 20, 48);
    doc.text(`Doctor: Dr. ${user.name}`, 150, 42);
    
    // Content Sections
    let y = 60;
    
    const addSection = (title, content, color) => {
      doc.setFontSize(14);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(50);
      
      if (Array.isArray(content)) {
        content.forEach(item => {
          const splitText = doc.splitTextToSize(`• ${item}`, 160);
          doc.text(splitText, 25, y);
          y += (splitText.length * 5) + 2;
        });
      } else {
        const splitText = doc.splitTextToSize(content, 160);
        doc.text(splitText, 20, y);
        y += (splitText.length * 5) + 5;
      }
      y += 5;
    };

    addSection("Symptoms", expandedNotes.symptoms, [59, 130, 246]);
    addSection("Diagnosis", expandedNotes.diagnosis, [79, 70, 229]);
    addSection("Prescription", expandedNotes.prescription, [16, 185, 129]);
    addSection("Doctor Advice", expandedNotes.advice, [100, 116, 139]);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("This is an AI-generated medical expansion based on clinical observations.", 20, 280);
    
    doc.save(`MedQueue_Report_${patient.token}.pdf`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Users size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Doctor Portal</h1>
          {queue.isBreak && (
            <span className="ml-4 bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-full animate-pulse flex items-center">
              <Coffee size={12} className="mr-1" /> ON BREAK
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-slate-600 font-medium">Dr. {user.name}</span>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">OPD Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-2xl font-black text-slate-800">{queue.activeTokens.length}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">Waiting</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-2xl font-black text-slate-800">{queue.isBreak ? 'PAUSED' : 'ACTIVE'}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <button
              onClick={callNext}
              disabled={queue.activeTokens.length === 0 || queue.isBreak}
              className={`w-full group relative flex flex-col items-center justify-center py-10 rounded-3xl transition-all duration-300 ${
                queue.activeTokens.length > 0 && !queue.isBreak
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 scale-100' 
                : 'bg-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <SkipForward className={`w-10 h-10 mb-3 transition-transform group-hover:translate-x-1 ${queue.activeTokens.length > 0 ? 'text-white' : 'text-slate-400'}`} />
              <span className={`text-lg font-black ${queue.activeTokens.length > 0 ? 'text-white' : 'text-slate-400'}`}>Call Next</span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleFinish}
                disabled={!queue.currentServing}
                className={`py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center ${
                  queue.currentServing ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={16} className="mr-2" /> Finish
              </button>
              <button
                onClick={handleToggleBreak}
                className={`py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center ${
                  queue.isBreak ? 'bg-orange-500 text-white shadow-lg' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
              >
                <Coffee size={16} className="mr-2" /> {queue.isBreak ? 'Resume' : 'Break'}
              </button>
            </div>
          </div>

          {/* Upcoming Patients */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Upcoming Queue</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {queue.activeTokens.slice(0, 5).map((p, idx) => (
                <div key={p.token} className="p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                      {p.token}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400">Wait: {p.estimatedWait}m</p>
                    </div>
                  </div>
                </div>
              ))}
              {queue.activeTokens.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-sm">No patients waiting.</div>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column: Current Serving & AI Notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Now Serving Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <span className={`flex items-center text-xs font-bold px-3 py-1 rounded-full ${queue.isBreak ? 'bg-orange-50 text-orange-500 animate-pulse' : 'bg-indigo-50 text-indigo-500'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${queue.isBreak ? 'bg-orange-500' : 'bg-indigo-500'}`}></div>
                {queue.isBreak ? 'ON BREAK' : 'LIVE SESSION'}
              </span>
            </div>
            
            <div className="p-8 flex items-center justify-between">
              {queue.currentServing ? (
                <>
                  <div className="flex items-center space-x-8">
                    <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <span className="text-xs uppercase font-bold opacity-80">Token</span>
                      <span className="text-4xl font-black">{queue.currentServing.token}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 mb-1">{queue.currentServing.name}</h2>
                      <div className="flex items-center space-x-4 text-slate-500">
                        <span className="flex items-center"><Clock size={16} className="mr-1" /> {queue.currentServing.phone}</span>
                        <span className="flex items-center"><Timer size={16} className="mr-1" /> Started at {new Date(queue.currentServing.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">Time Elapsed</p>
                    <p className="text-5xl font-mono font-black text-indigo-600 tracking-tighter">{formatTime(elapsed)}</p>
                  </div>
                </>
              ) : (
                <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400">
                  <Play size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">{queue.isBreak ? 'Currently on break' : 'Ready to serve next patient'}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Notes Section */}
          {queue.currentServing && (
            <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800 flex items-center text-lg">
                    <FileText size={20} className="mr-3 text-indigo-600" /> Live Clinical Notes
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Keyboard size={14} className="mr-2" /> Ctrl + Enter to Expand
                    </span>
                    {isExpanding && (
                      <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Generating...</span>
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  className="w-full bg-slate-50 rounded-3xl p-8 text-slate-700 font-medium border border-slate-100 focus:border-indigo-300 focus:ring-8 focus:ring-indigo-50/50 outline-none resize-none min-h-[250px] transition-all text-lg shadow-inner"
                  placeholder="e.g. BP 140/90, persistent cough, start Amoxicillin 500mg BD for 5 days..."
                  value={shorthand}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setShorthand(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-white rounded-[3rem] shadow-2xl p-10 flex flex-col border border-slate-100 overflow-hidden relative min-h-[500px]">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center text-2xl">
                      <Wand2 size={24} className="mr-4 text-primary-500" /> Digital Medical Report
                    </h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Generated by MedQueue AI Assistant</p>
                  </div>
                  <div className="flex space-x-3">
                    {expandedNotes && (
                      <button 
                        onClick={downloadPDF}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center transition-all shadow-lg shadow-emerald-900/20"
                      >
                        <Download size={14} className="mr-2" /> Download PDF
                      </button>
                    )}
                    <div className="bg-primary-50 text-primary-600 text-xs font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] border border-primary-100 shadow-sm flex items-center">
                      Verified Expansion
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar">
                  {isExpanding ? (
                    <div className="space-y-8 animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="h-32 bg-slate-100 rounded-3xl"></div>
                          <div className="h-24 bg-slate-100 rounded-3xl"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-40 bg-slate-100 rounded-3xl"></div>
                          <div className="h-20 bg-slate-100 rounded-3xl"></div>
                        </div>
                      </div>
                      <div className="h-24 bg-slate-50 rounded-3xl"></div>
                    </div>
                  ) : expandedNotes ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-8">
                        <div className="bg-blue-50/40 rounded-[2rem] p-8 border border-blue-100/50 shadow-sm">
                          <div className="flex items-center text-blue-600 mb-5">
                            <Activity size={20} className="mr-3" />
                            <span className="text-sm font-black uppercase tracking-widest">Clinical Presentation</span>
                          </div>
                          <ul className="space-y-3">
                            {expandedNotes.symptoms.map((s, i) => (
                              <li key={i} className="text-slate-700 font-bold flex items-start">
                                <span className="w-2 h-2 mt-2 bg-blue-400 rounded-full mr-4 flex-shrink-0"></span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-indigo-50/40 rounded-[2rem] p-8 border border-indigo-100/50 shadow-sm">
                          <div className="flex items-center text-indigo-600 mb-5">
                            <HeartPulse size={20} className="mr-3" />
                            <span className="text-sm font-black uppercase tracking-widest">Medical Diagnosis</span>
                          </div>
                          <p className="text-slate-900 font-black text-3xl leading-tight tracking-tight">{expandedNotes.diagnosis}</p>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div className="bg-emerald-50/40 rounded-[2rem] p-8 border border-emerald-100/50 shadow-sm">
                          <div className="flex items-center text-emerald-600 mb-5">
                            <Pill size={20} className="mr-3" />
                            <span className="text-sm font-black uppercase tracking-widest">Pharmacology / Prescription</span>
                          </div>
                          <div className="space-y-3">
                            {expandedNotes.prescription.map((p, i) => (
                              <div key={i} className="bg-white p-4 rounded-2xl text-slate-800 font-black shadow-sm border border-emerald-100 flex items-center">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-4"></span> {p}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                          <div className="flex items-center text-slate-500 mb-5">
                            <Info size={20} className="mr-3" />
                            <span className="text-sm font-black uppercase tracking-widest">Patient Advice</span>
                          </div>
                          <ul className="space-y-3">
                            {expandedNotes.advice.map((a, i) => (
                              <li key={i} className="text-slate-600 font-medium flex items-start italic leading-relaxed">
                                <span className="text-slate-300 mr-3">»</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {expandedNotes.questions && expandedNotes.questions.length > 0 && (
                        <div className="md:col-span-2 bg-amber-50/50 rounded-[2rem] p-8 border border-amber-200/50 shadow-sm">
                          <div className="flex items-center text-amber-600 mb-5">
                            <HelpCircle size={20} className="mr-3" />
                            <span className="text-sm font-black uppercase tracking-widest">Suggested Diagnostic Inquiries</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {expandedNotes.questions.map((q, i) => (
                              <div key={i} className="bg-white p-4 rounded-2xl text-amber-900 font-bold border border-amber-100 shadow-sm">
                                "{q}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-200 py-32 text-center">
                      <Zap size={80} className="mb-6 opacity-5" />
                      <p className="text-2xl font-black text-slate-300">Awaiting Consultation Data</p>
                      <p className="text-slate-400 font-medium mt-2 max-w-sm">Press <kbd className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 text-xs font-mono">Ctrl + Enter</kbd> above to generate the professional report.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
