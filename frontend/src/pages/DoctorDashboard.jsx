import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Play, SkipForward, Users, Clock, LogOut, CheckCircle, Timer,
  Coffee, Zap, Wand2, FileText, HeartPulse, Pill, Info, HelpCircle, Keyboard, Download
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState({ activeTokens: [], currentServing: null, isBreak: false });
  const [elapsed, setElapsed] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);

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
          activeTokens: data.activeTokens ? Object.values(data.activeTokens) : [],
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
      setChatHistory([]);
    }
    return () => clearInterval(timerRef.current);
  }, [queue.currentServing]);

  const callNext = async () => {
    setPendingAction('next');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/next`,
        { clinicId: user.clinicId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error calling next patient');
    } finally {
      setPendingAction(null);
    }
  };

  const handleFinish = async () => {
    setPendingAction('finish');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/finish`,
        {
          clinicId: user.clinicId,
          report: expandedNotes || {}
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert('Error finishing session');
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleBreak = async () => {
    setPendingAction('break');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/queue/break`,
        { clinicId: user.clinicId, isBreak: !queue.isBreak },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert('Error toggling break');
    } finally {
      setPendingAction(null);
    }
  };

  // AI Scribe Co-pilot Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  // Add Item Inline Inputs State
  const [newSymptom, setNewSymptom] = useState('');
  const [newPrescription, setNewPrescription] = useState('');
  const [newAdvice, setNewAdvice] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newTest, setNewTest] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState({});

  // Inline editing helpers
  const updateDiagnosis = (val) => {
    setExpandedNotes(prev => prev ? { ...prev, diagnosis: val } : null);
  };

  const updateSymptom = (index, val) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      const updated = [...prev.symptoms];
      updated[index] = val;
      return { ...prev, symptoms: updated };
    });
  };

  const deleteSymptom = (index) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, symptoms: prev.symptoms.filter((_, i) => i !== index) };
    });
  };

  const addSymptom = (val) => {
    if (!val.trim()) return;
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, symptoms: [...prev.symptoms, val.trim()] };
    });
    setNewSymptom('');
  };

  const updatePrescription = (index, val) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      const updated = [...prev.prescription];
      updated[index] = val;
      return { ...prev, prescription: updated };
    });
  };

  const deletePrescription = (index) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, prescription: prev.prescription.filter((_, i) => i !== index) };
    });
  };

  const addPrescription = (val) => {
    if (!val.trim()) return;
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, prescription: [...prev.prescription, val.trim()] };
    });
    setNewPrescription('');
  };

  const updateAdvice = (index, val) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      const updated = [...prev.advice];
      updated[index] = val;
      return { ...prev, advice: updated };
    });
  };

  const deleteAdvice = (index) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, advice: prev.advice.filter((_, i) => i !== index) };
    });
  };

  const addAdvice = (val) => {
    if (!val.trim()) return;
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, advice: [...prev.advice, val.trim()] };
    });
    setNewAdvice('');
  };

  const updateQuestion = (index, val) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      const updated = [...(prev.questions || [])];
      updated[index] = val;
      return { ...prev, questions: updated };
    });
  };

  const deleteQuestion = (index) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, questions: (prev.questions || []).filter((_, i) => i !== index) };
    });
  };

  const addQuestion = (val) => {
    if (!val.trim()) return;
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, questions: [...(prev.questions || []), val.trim()] };
    });
    setNewQuestion('');
  };

  const updateTest = (index, val) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      const updated = [...(prev.suggestedTests || [])];
      updated[index] = val;
      return { ...prev, suggestedTests: updated };
    });
  };

  const deleteTest = (index) => {
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, suggestedTests: (prev.suggestedTests || []).filter((_, i) => i !== index) };
    });
  };

  const addTest = (val) => {
    if (!val.trim()) return;
    setExpandedNotes(prev => {
      if (!prev) return null;
      return { ...prev, suggestedTests: [...(prev.suggestedTests || []), val.trim()] };
    });
    setNewTest('');
  };

  const handleAnswerQuestion = async (index, questionText) => {
    const answer = questionAnswers[index];
    if (!answer || !answer.trim() || !expandedNotes) return;

    const answerQuery = `The patient was asked: "${questionText}" and answered: "${answer.trim()}". Please update the diagnosis, symptoms, prescriptions, advice, or diagnostic tests based on this new patient response.`;

    setChatHistory(prev => [...prev, { sender: 'doctor', text: `Asked: "${questionText}"\nAnswer: "${answer.trim()}"` }]);
    setQuestionAnswers(prev => ({ ...prev, [index]: '' }));
    setIsConsulting(true);

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/discuss`, {
        currentReport: expandedNotes,
        query: answerQuery,
        shorthand: shorthand
      }, { headers });

      setChatHistory(prev => [...prev, { sender: 'ai', text: data.chatResponse }]);
      if (data.updatedReport) {
        setExpandedNotes(data.updatedReport);
      }
    } catch (err) {
      console.error('AI Answer update failed', err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'I encountered an error updating the report based on this answer. Please try again.' }]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleConsultAIScribe = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !expandedNotes) return;

    const doctorQuery = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: 'doctor', text: doctorQuery }]);
    setChatInput('');
    setIsConsulting(true);

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/discuss`, {
        currentReport: expandedNotes,
        query: doctorQuery,
        shorthand: shorthand
      }, { headers });

      setChatHistory(prev => [...prev, { sender: 'ai', text: data.chatResponse }]);
      if (data.updatedReport) {
        setExpandedNotes(data.updatedReport);
      }
    } catch (err) {
      console.error('AI Discussion failed', err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'I encountered an error processing your inquiry. Please try again.' }]);
    } finally {
      setIsConsulting(false);
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
      setChatHistory([
        {
          sender: 'ai',
          text: `Hello Dr. ${user.name}. I have processed your shorthand notes and generated a medical report. You can ask me to adjust doses, check drug interactions, or refine diagnostic questions here.`
        }
      ]);
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
    doc.setTextColor(16, 185, 129); // Clinical Emerald Green
    doc.text("MedQueue Medical Report", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Clinic ID: ${user.clinicId}`, 20, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);

    // Patient Info
    doc.setDrawColor(200, 230, 210);
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

    addSection("Symptoms", expandedNotes.symptoms, [13, 148, 136]); // Teal
    addSection("Diagnosis", expandedNotes.diagnosis, [4, 120, 87]); // Deep Emerald
    addSection("Prescription", expandedNotes.prescription, [16, 185, 129]); // Emerald Green
    addSection("Doctor Advice", expandedNotes.advice, [71, 85, 105]); // Slate
    if (expandedNotes.suggestedTests && expandedNotes.suggestedTests.length > 0) {
      addSection("Suggested Diagnostic Tests", expandedNotes.suggestedTests, [194, 120, 3]); // Amber / Orange
    }

    // Footer
    doc.setFontSize(9);
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
    <div className="min-h-screen bg-[#f4fbf7]">
      {/* Premium Glass Nav Bar */}
      <nav className="bg-white border-b border-emerald-100/50 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <HeartPulse size={20} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Doctor<span className="text-emerald-500">Portal</span></h1>
          {queue.isBreak && (
            <span className="ml-4 bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full animate-pulse flex items-center border border-orange-200">
              <Coffee size={12} className="mr-1" /> ON BREAK
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-600 text-sm font-bold">Dr. {user.name}</span>
          <div className="h-6 w-px bg-slate-200"></div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-50 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Control Bar: Compact Queue Controller Banner */}
        <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-xl shadow-emerald-950/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          {/* Background decorative touch */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl opacity-80 pointer-events-none"></div>

          {/* Left side: Active Serving Patient info */}
          <div className="flex items-center space-x-6">
            {queue.currentServing ? (
              <>
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-600/20 flex-shrink-0">
                  <span className="text-[8px] uppercase font-black opacity-80 tracking-widest">Token</span>
                  <span className="text-2xl font-black mt-0.5">{queue.currentServing.token}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{queue.currentServing.name}</h2>
                    {queue.currentServing.isEmergency && (
                      <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md animate-pulse uppercase tracking-wider">
                        Urgent Case
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-slate-400 font-bold text-[10px] mt-1.5 uppercase tracking-wider">
                    <span className="flex items-center"><Clock size={12} className="mr-1 text-emerald-500" /> {queue.currentServing.phone}</span>
                    <span className="h-3.5 w-px bg-slate-200"></span>
                    <span className="flex items-center"><Timer size={12} className="mr-1 text-emerald-500" /> Serving: {formatTime(elapsed)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-slate-400">
                <Play size={24} className="text-emerald-500 animate-pulse" />
                <div>
                  <p className="text-sm font-black text-slate-700">{queue.isBreak ? 'Currently On Break' : 'Ready to Serve Next Patient'}</p>
                  <p className="text-[10px] font-semibold text-slate-400">Press "Call Next" on the right to call a waiting patient.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right side: OPD status + compact controls */}
          <div className="flex flex-wrap items-center gap-4 z-10">
            {/* OPD waiting count */}
            <div className="bg-[#f7fcf9] border border-emerald-50 px-4 py-2 rounded-2xl flex items-center space-x-3 shadow-inner">
              <div>
                <p className="text-lg font-black text-slate-800 leading-none">{queue.activeTokens.length}</p>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider mt-1">In Queue</p>
              </div>

              {/* Tiny Upcoming list popover / preview */}
              {queue.activeTokens.length > 0 && (
                <div className="relative group">
                  <button className="bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-100 hover:border-emerald-200 rounded-lg p-1.5 transition-all text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center">
                    Next List
                  </button>
                  {/* Hover list card */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-emerald-100 rounded-2xl shadow-2xl p-4 hidden group-hover:block z-30 animate-in fade-in zoom-in-95 duration-200 text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-50">Next in OPD line</p>
                    <div className="space-y-2">
                      {queue.activeTokens.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 truncate max-w-[120px]">{p.name}</span>
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-md">Token {p.token}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Call Next Button */}
            <button
              onClick={callNext}
              disabled={queue.activeTokens.length === 0 || queue.isBreak || pendingAction !== null}
              className={`px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md ${queue.activeTokens.length > 0 && !queue.isBreak && !pendingAction
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20'
                  : 'bg-slate-150 text-slate-400 cursor-not-allowed opacity-50 shadow-none'
                }`}
            >
              {pendingAction === 'next' ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SkipForward size={12} />
              )}
              <span>{pendingAction === 'next' ? 'Calling...' : 'Call Next'}</span>
            </button>

            {/* Finish Button */}
            <button
              onClick={handleFinish}
              disabled={!queue.currentServing || pendingAction !== null}
              className={`px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-1.5 border ${queue.currentServing && !pendingAction
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                }`}
            >
              {pendingAction === 'finish' ? (
                <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={12} />
              )}
              <span>{pendingAction === 'finish' ? 'Finishing...' : 'Finish Case'}</span>
            </button>

            {/* Break/Resume Button */}
            <button
              onClick={handleToggleBreak}
              disabled={pendingAction !== null}
              className={`px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-1.5 border ${queue.isBreak && !pendingAction
                  ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                  : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100'
                }`}
            >
              {pendingAction === 'break' ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Coffee size={12} />
              )}
              <span>{pendingAction === 'break' ? 'Updating...' : queue.isBreak ? 'Resume' : 'Break'}</span>
            </button>
          </div>
        </div>

        {/* Main Consultation Scribing Workspace */}
        {queue.currentServing ? (
          <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Shorthand Notes card */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 flex items-center text-xs tracking-wider uppercase">
                  <FileText size={16} className="mr-2 text-emerald-600" /> Live Clinical Shorthand Notes
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Keyboard size={10} className="mr-1" /> Ctrl + Enter to Expand
                  </span>
                  {isExpanding && (
                    <div className="flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-100">
                      <div className="w-2 h-2 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">AI Expanding...</span>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                className="w-full bg-[#fcfdfd] rounded-2xl p-4 text-slate-700 font-bold border border-slate-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50/50 outline-none resize-none min-h-[80px] transition-all text-sm placeholder-slate-400"
                placeholder="e.g. BP 140/90, persistent cough, start Amoxicillin 500mg BD for 5 days..."
                value={shorthand}
                onKeyDown={handleKeyDown}
                onChange={(e) => setShorthand(e.target.value)}
              ></textarea>
            </div>

            {isExpanding ? (
              <div className="bg-white rounded-[2.5rem] p-10 border border-emerald-100 shadow-xl space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-32 bg-slate-50 rounded-2xl"></div>
                    <div className="h-24 bg-slate-50 rounded-2xl"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-40 bg-slate-50 rounded-2xl"></div>
                    <div className="h-20 bg-slate-50 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ) : expandedNotes ? (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Left Column: Chat Co-pilot */}
                <div className="xl:col-span-2 bg-white rounded-[2rem] border border-emerald-100/60 shadow-xl p-6 flex flex-col h-[650px] relative">
                  <div className="flex items-center space-x-2.5 pb-4 mb-4 border-b border-emerald-50">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100 flex items-center justify-center">
                      <Wand2 size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">AI Scribe Co-Pilot</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Case Discussion</p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-4">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm ${msg.sender === 'doctor'
                            ? 'bg-slate-700 text-white rounded-tr-none'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-100/60 rounded-tl-none'
                          }`}>
                          <p className="font-extrabold uppercase tracking-widest text-[8px] opacity-60 mb-1">
                            {msg.sender === 'doctor' ? 'You (Doctor)' : 'MedQueue AI'}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isConsulting && (
                      <div className="flex justify-start">
                        <div className="bg-emerald-50 text-emerald-900 border border-emerald-100/60 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200"></div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Consulting AI...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleConsultAIScribe} className="pt-4 border-t border-emerald-50 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Ask AI co-pilot to change meds, check safety..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isConsulting}
                      className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isConsulting || !chatInput.trim()}
                      className={`px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm ${chatInput.trim() && !isConsulting
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      Send
                    </button>
                  </form>
                </div>

                {/* Right Column: Interactive Editor */}
                <div className="xl:col-span-3 bg-white rounded-[2rem] border border-emerald-100/60 shadow-xl p-6 flex flex-col h-[650px] relative">
                  <div className="flex justify-between items-center pb-4 mb-4 border-b border-emerald-50">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">Interactive Report Editor</h4>
                      <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Real-time editable fields for verified PDF export</p>
                    </div>
                    <button
                      onClick={downloadPDF}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center transition-all shadow-md shadow-emerald-600/10"
                    >
                      <Download size={10} className="mr-1" /> Download PDF
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar pb-6">
                    {/* Diagnosis */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                        <HeartPulse size={12} className="mr-1.5 text-emerald-500 animate-pulse" /> Diagnosis
                      </label>
                      <input
                        type="text"
                        value={expandedNotes.diagnosis}
                        onChange={(e) => updateDiagnosis(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50/50 outline-none rounded-xl px-3.5 py-2.5 text-slate-800 font-black text-xs transition-all"
                      />
                    </div>

                    {/* Symptoms */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <FileText size={12} className="mr-1.5 text-emerald-500" /> Presentation / Symptoms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {expandedNotes.symptoms.map((sym, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm group hover:border-emerald-200 transition-colors">
                            <input
                              type="text"
                              value={sym}
                              onChange={(e) => updateSymptom(idx, e.target.value)}
                              className="bg-transparent text-slate-700 font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-100 rounded px-1"
                            />
                            <button
                              type="button"
                              onClick={() => deleteSymptom(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add symptom..."
                          value={newSymptom}
                          onChange={(e) => setNewSymptom(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(newSymptom); } }}
                        />
                        <button
                          type="button"
                          onClick={() => addSymptom(newSymptom)}
                          className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Prescriptions */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Pill size={12} className="mr-1.5 text-emerald-500" /> Prescriptions & pharmacology
                      </label>
                      <div className="space-y-2">
                        {expandedNotes.prescription.map((rx, idx) => (
                          <div key={idx} className="bg-white border border-emerald-100/30 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-emerald-300 transition-all">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 flex-shrink-0"></span>
                            <input
                              type="text"
                              value={rx}
                              onChange={(e) => updatePrescription(idx, e.target.value)}
                              className="flex-1 bg-transparent text-slate-800 font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-100 rounded px-1"
                            />
                            <button
                              type="button"
                              onClick={() => deletePrescription(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add prescription details..."
                          value={newPrescription}
                          onChange={(e) => setNewPrescription(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrescription(newPrescription); } }}
                        />
                        <button
                          type="button"
                          onClick={() => addPrescription(newPrescription)}
                          className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Patient Advice */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Info size={12} className="mr-1.5 text-emerald-500" /> Patient Advice
                      </label>
                      <div className="space-y-2">
                        {expandedNotes.advice.map((adv, idx) => (
                          <div key={idx} className="bg-white border border-slate-150 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-slate-350 transition-all">
                            <span className="text-slate-400 mr-2 text-xs flex-shrink-0">»</span>
                            <input
                              type="text"
                              value={adv}
                              onChange={(e) => updateAdvice(idx, e.target.value)}
                              className="flex-1 bg-transparent text-slate-600 font-bold text-xs italic outline-none focus:ring-1 focus:ring-slate-150 rounded px-1"
                            />
                            <button
                              type="button"
                              onClick={() => deleteAdvice(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add advice..."
                          value={newAdvice}
                          onChange={(e) => setNewAdvice(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAdvice(newAdvice); } }}
                        />
                        <button
                          type="button"
                          onClick={() => addAdvice(newAdvice)}
                          className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Suggested Inquiries */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <HelpCircle size={12} className="mr-1.5 text-emerald-500" /> Suggested Inquiries & Patient Responses
                      </label>
                      <div className="space-y-3">
                        {(expandedNotes.questions || []).map((q, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-amber-200 transition-all space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <span className="text-amber-500 font-bold text-xs">?</span>
                                <input
                                  type="text"
                                  value={q}
                                  onChange={(e) => updateQuestion(idx, e.target.value)}
                                  className="flex-1 bg-transparent text-slate-700 font-bold text-xs outline-none focus:ring-1 focus:ring-slate-100 rounded px-1"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteQuestion(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Patient Answer field */}
                            <div className="flex items-center space-x-2 pt-1 border-t border-slate-50">
                              <input
                                type="text"
                                placeholder="Type patient response to remake report..."
                                value={questionAnswers[idx] || ''}
                                onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-600 font-semibold focus:outline-none focus:border-emerald-500 transition-all text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAnswerQuestion(idx, q);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={!(questionAnswers[idx] || '').trim() || isConsulting}
                                onClick={() => handleAnswerQuestion(idx, q)}
                                className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${(questionAnswers[idx] || '').trim() && !isConsulting
                                    ? 'bg-amber-500 border-amber-600 text-white shadow-sm hover:bg-amber-400'
                                    : 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                                  }`}
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add new custom check question..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(newQuestion); } }}
                        />
                        <button
                          type="button"
                          onClick={() => addQuestion(newQuestion)}
                          className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Suggested Diagnostic Tests */}
                    <div className="bg-[#fcfdfd] border border-emerald-100/40 rounded-2xl p-4 shadow-sm space-y-4">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Zap size={12} className="mr-1.5 text-amber-500 animate-pulse" /> Suggested Diagnostic Tests
                      </label>
                      <div className="space-y-2">
                        {(expandedNotes.suggestedTests || []).map((test, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-amber-200 transition-all">
                            <span className="text-amber-500 font-bold mr-2 text-xs">✓</span>
                            <input
                              type="text"
                              value={test}
                              onChange={(e) => updateTest(idx, e.target.value)}
                              className="flex-1 bg-transparent text-slate-700 font-bold text-xs outline-none focus:ring-1 focus:ring-slate-100 rounded px-1"
                            />
                            <button
                              type="button"
                              onClick={() => deleteTest(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add clinical or laboratory test..."
                          value={newTest}
                          onChange={(e) => setNewTest(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTest(newTest); } }}
                        />
                        <button
                          type="button"
                          onClick={() => addTest(newTest)}
                          className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-xl p-16 flex flex-col items-center justify-center text-slate-400 text-center border border-emerald-100/50">
                <Zap size={60} className="mb-4 opacity-5 text-emerald-500" />
                <p className="text-lg font-black text-slate-700">Awaiting Observations</p>
                <p className="text-xs text-slate-400 font-semibold mt-1.5 max-w-xs">Type your shorthand observations in the card above and click <kbd className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-mono text-[10px]">Ctrl + Enter</kbd> to compile the report.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl p-20 flex flex-col items-center justify-center text-slate-400 text-center">
            <Play size={64} className="mb-4 opacity-25 text-emerald-600 animate-pulse" />
            <p className="text-xl font-extrabold text-slate-700">Awaiting Active Serving Case</p>
            <p className="text-xs text-slate-400 font-semibold mt-1.5">Press "Call Next" in the controller header above to call a patient from the waiting queue.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
