const { db } = require('../config/firebase');
const Clinic = require('../models/Clinic');
const PatientHistory = require('../models/PatientHistory');
const { sendWhatsAppNotification } = require('./whatsappService');
const { analyzeEmergency } = require('./aiService');
const { sendSMS } = require('./smsService');
const os = require('os');

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  const interfaces = os.networkInterfaces();
  let fallback = 'http://localhost:5173';
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('192.168.')) {
          return `http://${net.address}:5173`;
        }
        if (net.address.startsWith('10.') || net.address.startsWith('172.16.') || net.address.startsWith('172.31.')) {
          fallback = `http://${net.address}:5173`;
        }
      }
    }
  }
  return fallback;
};

const getQueueRef = (clinicId) => db().ref(`queues/${clinicId}`);

const registerPatient = async (clinicId, patientData) => {
  console.log('Backend: Registering patient for clinicId:', clinicId);
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val() || { lastToken: 0, activeTokens: [] };

  const newTokenNum = (queueData.lastToken || 0) + 1;
  const token = `T-${newTokenNum}`;

  const clinic = await Clinic.findById(clinicId);
  const avgWait = clinic ? clinic.averageConsultationTime : 15;
  const estimatedWait = (queueData.activeTokens?.length || 0) * avgWait;

  // AI Triage Analysis
  let triageResult = { priority: 'NORMAL', severityScore: 0, reason: '' };
  if (patientData.symptoms) {
    triageResult = await analyzeEmergency(patientData.symptoms);
  }

  // Support manual override from receptionist checkbox
  if (patientData.isEmergency && triageResult.priority === 'NORMAL') {
    triageResult.priority = 'URGENT';
    triageResult.severityScore = 5; // Default middle severity for manual overrides
  }

  const now = new Date();
  const expectedDate = new Date(now.getTime() + estimatedWait * 60000);
  const expectedTime = expectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newPatient = {
    token,
    name: patientData.name,
    phone: patientData.phone,
    symptoms: patientData.symptoms || '',
    status: 'Waiting',
    estimatedWait: triageResult.priority === 'URGENT' ? 0 : estimatedWait,
    expectedTime: triageResult.priority === 'URGENT' ? 'ASAP' : expectedTime,
    notificationType: patientData.notificationType || 'WhatsApp',
    isEmergency: triageResult.priority === 'URGENT' || false,
    severityScore: triageResult.severityScore || 0,
    triageReason: triageResult.reason,
    arrivalTime: now.toISOString(),
    initialExpectedTimestamp: expectedDate.getTime(),
    lastDelayNotified: 0,
  };

  const oldActiveTokens = queueData.activeTokens ? Object.values(queueData.activeTokens).filter(Boolean) : [];

  if (newPatient.isEmergency) {
    // 1. Sort emergency patients at top by severityScore descending, then arrivalTime ascending
    const existingEmergency = oldActiveTokens.filter(p => p.isEmergency);
    const existingRegular = oldActiveTokens.filter(p => !p.isEmergency);
    
    const allEmergency = [...existingEmergency, newPatient];
    allEmergency.sort((a, b) => {
      const scoreDiff = (b.severityScore || 0) - (a.severityScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(a.arrivalTime) - new Date(b.arrivalTime);
    });

    const newQueueList = [...allEmergency, ...existingRegular];

    // 2. Determine expected start time of the next patient
    let expectedStartOfNext;
    if (queueData.isBreak) {
      expectedStartOfNext = now.getTime() + 10 * 60000;
    } else if (
      queueData.currentServing &&
      queueData.currentServing.status === 'Serving' &&
      queueData.currentServing.startTime
    ) {
      const startTime = new Date(queueData.currentServing.startTime);
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const remainingServingTime = Math.max(0, avgWait - elapsedMinutes);
      expectedStartOfNext = now.getTime() + remainingServingTime * 60000;
    } else {
      expectedStartOfNext = now.getTime();
    }

    // 3. Recalculate ETAs for all existing patients and send alert if their ETA changed/delayed
    const recalculatedTokens = [];
    for (let i = 0; i < newQueueList.length; i++) {
      const p = newQueueList[i];
      if (p.token === newPatient.token) {
        recalculatedTokens.push(p);
        continue;
      }

      let wait, newExpectedTimeStr;
      if (p.isEmergency) {
        wait = 0;
        newExpectedTimeStr = 'ASAP';
      } else {
        wait = Math.max(0, Math.round((expectedStartOfNext + (i * avgWait * 60000) - now.getTime()) / 60000));
        const expDate = new Date(now.getTime() + wait * 60000);
        newExpectedTimeStr = expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const oldExpectedTimeStr = p.expectedTime;
      const initialTimestamp = p.initialExpectedTimestamp || (now.getTime() + (p.estimatedWait || 0) * 60000);
      const lastNotified = p.lastDelayNotified || 0;

      let currentDelay = 0;
      if (!p.isEmergency) {
        const expDate = new Date(now.getTime() + wait * 60000);
        currentDelay = Math.max(0, Math.floor((expDate.getTime() - initialTimestamp) / 60000));
      }

      let nextLastNotified = lastNotified;
      let shouldNotify = false;

      // If delayed (ETA string changed) due to emergency insertion
      if (!p.isEmergency && newExpectedTimeStr !== oldExpectedTimeStr) {
        shouldNotify = true;
        nextLastNotified = Math.max(lastNotified, currentDelay);
      }

      const updatedPatient = {
        ...p,
        estimatedWait: wait,
        expectedTime: newExpectedTimeStr,
        initialExpectedTimestamp: initialTimestamp,
        lastDelayNotified: nextLastNotified
      };

      recalculatedTokens.push(updatedPatient);

      if (shouldNotify) {
        if (p.notificationType === 'WhatsApp') {
          const delayMessage = `🚨 *CLINIC EMERGENCY UPDATE*\n----------------------------------------\nHi *${p.name}*, an urgent emergency case has just been prioritized at the clinic.\n\nYour expected turn time for Token *${p.token}* has been adjusted to *${newExpectedTimeStr}* (delayed by an additional *${avgWait}* mins).\n\nTrack live status here: ${getFrontendUrl()}/status/${clinicId}/${p.token}\n----------------------------------------\nThank you for your understanding and cooperation!`;
          sendWhatsAppNotification(p.phone, delayMessage);
        } else if (p.notificationType === 'SMS') {
          const smsMessage = `🚨 MedQueue Alert: An urgent case was prioritized. Your turn for ${p.token} is adjusted to ${newExpectedTimeStr} (+${avgWait}m). Track: ${getFrontendUrl()}/status/${clinicId}/${p.token}`;
          sendSMS(p.phone, smsMessage);
        }
      }
    }

    queueData.activeTokens = recalculatedTokens;
  } else {
    // Regular patient: append to the end of list and calculate their ETA
    let expectedStartOfNext;
    if (queueData.isBreak) {
      expectedStartOfNext = now.getTime() + 10 * 60000;
    } else if (
      queueData.currentServing &&
      queueData.currentServing.status === 'Serving' &&
      queueData.currentServing.startTime
    ) {
      const startTime = new Date(queueData.currentServing.startTime);
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const remainingServingTime = Math.max(0, avgWait - elapsedMinutes);
      expectedStartOfNext = now.getTime() + remainingServingTime * 60000;
    } else {
      expectedStartOfNext = now.getTime();
    }

    const i = oldActiveTokens.length;
    const wait = Math.max(0, Math.round((expectedStartOfNext + (i * avgWait * 60000) - now.getTime()) / 60000));
    const expDate = new Date(now.getTime() + wait * 60000);
    const expectedTimeStr = expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    newPatient.estimatedWait = wait;
    newPatient.expectedTime = expectedTimeStr;
    newPatient.initialExpectedTimestamp = expDate.getTime();

    queueData.activeTokens = [...oldActiveTokens, newPatient];
  }

  await queueRef.update({
    lastToken: newTokenNum,
    activeTokens: queueData.activeTokens,
  });

  // Notifications for the registered patient
  const frontendUrl = getFrontendUrl();
  const message = newPatient.isEmergency
    ? `🚨 EMERGENCY ALERT: Hi ${newPatient.name}, our AI has detected urgent symptoms (Severity Level: L${newPatient.severityScore}). You have been prioritized and moved to the top of the queue. Please proceed to the receptionist desk immediately.`
    : `Hi ${newPatient.name}, your token is ${token}. Your turn is expected at ${newPatient.expectedTime}. Track live: ${frontendUrl}/status/${clinicId}/${token}`;

  if (newPatient.notificationType === 'WhatsApp') {
    sendWhatsAppNotification(newPatient.phone, message);
  } else if (newPatient.notificationType === 'SMS') {
    sendSMS(newPatient.phone, message);
  }

  return newPatient;
};

const callNextPatient = async (clinicId, doctorId) => {
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val();

  if (!queueData || !queueData.activeTokens || queueData.activeTokens.length === 0) return null;

  const completedPatient = queueData.currentServing;
  if (completedPatient) {
    await PatientHistory.create({
      patientName: completedPatient.name,
      phone: completedPatient.phone,
      tokenNumber: completedPatient.token,
      status: 'Completed',
      doctorId,
      clinicId,
      consultationDuration: completedPatient.startTime ? Math.round((new Date() - new Date(completedPatient.startTime)) / 60000) : 0
    });
  }

  const nextPatient = queueData.activeTokens[0];
  const updatedActiveTokens = queueData.activeTokens.slice(1);
  const clinic = await Clinic.findById(clinicId);
  const avgWait = clinic ? clinic.averageConsultationTime : 15;

  const recalculatedTokens = updatedActiveTokens.map((p, index) => {
    if (p.isEmergency) {
      return {
        ...p,
        estimatedWait: 0,
        expectedTime: 'ASAP',
        initialExpectedTimestamp: p.initialExpectedTimestamp || new Date().getTime(),
        lastDelayNotified: p.lastDelayNotified || 0
      };
    }
    const wait = index * avgWait;
    const expDate = new Date(new Date().getTime() + wait * 60000);
    return {
      ...p,
      estimatedWait: wait,
      expectedTime: expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      initialExpectedTimestamp: p.initialExpectedTimestamp || expDate.getTime(),
      lastDelayNotified: p.lastDelayNotified || 0
    };
  });

  // Notification Trigger: If a patient is now 3rd in line (index 2)
  if (recalculatedTokens.length >= 3) {
    const thirdPatient = recalculatedTokens[2];
    const msg = `Hi ${thirdPatient.name}, you are 3rd in line at ${clinic.name}. Your turn is expected at ${thirdPatient.expectedTime}. Please be ready!`;
    if (thirdPatient.notificationType === 'WhatsApp') {
      sendWhatsAppNotification(thirdPatient.phone, msg);
    } else if (thirdPatient.notificationType === 'SMS') {
      sendSMS(thirdPatient.phone, msg);
    }
  }

  const currentServing = {
    ...nextPatient,
    status: 'Serving',
    startTime: new Date().toISOString()
  };

  // Notification Trigger: Your turn is NOW
  const turnMessage = `🔔 IT'S YOUR TURN! Hi ${currentServing.name}, please proceed to the doctor's office now. (Token: ${currentServing.token})`;
  if (currentServing.notificationType === 'WhatsApp') {
    sendWhatsAppNotification(currentServing.phone, turnMessage);
  } else if (currentServing.notificationType === 'SMS') {
    sendSMS(currentServing.phone, turnMessage);
  }

  await queueRef.update({
    currentServing,
    activeTokens: recalculatedTokens
  });

  return currentServing;
};

const markAbsent = async (clinicId, token) => {
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val();

  if (!queueData || !queueData.activeTokens) return;

  const patientIndex = queueData.activeTokens.findIndex(p => p.token === token);
  if (patientIndex === -1) return;

  const patient = queueData.activeTokens[patientIndex];
  const updatedActiveTokens = queueData.activeTokens.filter(p => p.token !== token);
  const updatedHoldingList = [...(queueData.holdingList || []), { ...patient, status: 'Absent' }];

  await queueRef.update({
    activeTokens: updatedActiveTokens,
    holdingList: updatedHoldingList
  });
};

const resetQueue = async (clinicId) => {
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val();

  if (queueData) {
    await queueRef.set({
      lastToken: 0,
      activeTokens: [],
      currentServing: null,
      holdingList: [],
      isBreak: false
    });
  }
};

const completeCurrentPatient = async (clinicId, doctorId, reportData = {}) => {
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val();

  if (!queueData || !queueData.currentServing) return null;

  const completedPatient = queueData.currentServing;
  await PatientHistory.create({
    patientName: completedPatient.name,
    phone: completedPatient.phone,
    tokenNumber: completedPatient.token,
    status: 'Completed',
    doctorId,
    clinicId,
    consultationDuration: completedPatient.startTime ? Math.round((new Date() - new Date(completedPatient.startTime)) / 60000) : 0,
    symptoms: reportData.symptoms || [],
    diagnosis: reportData.diagnosis || '',
    prescription: reportData.prescription || [],
    advice: reportData.advice || [],
    suggestedTests: reportData.suggestedTests || [],
  });

  await queueRef.update({
    currentServing: null
  });

  // Send WhatsApp/SMS Digital Report Summary
  if (completedPatient.notificationType === 'WhatsApp') {
    const formattedSymptoms = reportData.symptoms?.length > 0 ? reportData.symptoms.map(s => `• ${s}`).join('\n') : '• None recorded';
    const formattedPrescription = reportData.prescription?.length > 0 ? reportData.prescription.map(p => `• ${p}`).join('\n') : '• None recorded';
    const formattedAdvice = reportData.advice?.length > 0 ? reportData.advice.map(a => `• ${a}`).join('\n') : '• None recorded';
    const formattedTests = reportData.suggestedTests?.length > 0 ? reportData.suggestedTests.map(t => `• ${t}`).join('\n') : '• None recorded';

    const message = `📋 *MEDQUEUE DIGITAL CONSULTATION REPORT*
----------------------------------------
*Patient Name:* ${completedPatient.name}
*Token:* ${completedPatient.token}
*Date:* ${new Date().toLocaleDateString()}

🩺 *DIAGNOSIS:*
${reportData.diagnosis || 'Under clinical evaluation'}

⚠️ *SYMPTOMS:*
${formattedSymptoms}

💊 *PRESCRIPTION / MEDS:*
${formattedPrescription}

📋 *CLINICAL ADVICE:*
${formattedAdvice}

🔬 *SUGGESTED TESTS:*
${formattedTests}

----------------------------------------
Thank you for choosing MedQueue! This digital prescription acts as an authentic consultation receipt.`;

    sendWhatsAppNotification(completedPatient.phone, message);
  } else if (completedPatient.notificationType === 'SMS') {
    const smsMessage = `📋 MedQueue: Your consultation report is ready. Diagnosis: ${reportData.diagnosis || 'Under evaluation'}. View full report here: ${getFrontendUrl()}/status/${clinicId}/${completedPatient.token}`;
    sendSMS(completedPatient.phone, smsMessage);
  }

  return completedPatient;
};

const toggleBreak = async (clinicId, isBreak) => {
  const queueRef = getQueueRef(clinicId);
  const snapshot = await queueRef.once('value');
  const queueData = snapshot.val();

  await queueRef.update({ isBreak });

  // If entering break, notify active tokens
  if (isBreak && queueData?.activeTokens?.length > 0) {
    const nextThree = queueData.activeTokens.slice(0, 3);
    nextThree.forEach(p => {
      const msg = `Notice: The doctor is taking a short break. Your estimated wait time may be slightly adjusted. Thank you for your patience!`;
      if (p.notificationType === 'WhatsApp') {
        sendWhatsAppNotification(p.phone, msg);
      } else if (p.notificationType === 'SMS') {
        sendSMS(p.phone, msg);
      }
    });
  }
};

module.exports = {
  registerPatient,
  callNextPatient,
  markAbsent,
  resetQueue,
  completeCurrentPatient,
  toggleBreak
};
