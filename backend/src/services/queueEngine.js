const { db } = require('../config/firebase');
const Clinic = require('../models/Clinic');
const PatientHistory = require('../models/PatientHistory');
const { sendWhatsAppNotification } = require('./whatsappService');

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

  // Calculate Expected Time (Current Time + estimatedWait)
  const now = new Date();
  const expectedDate = new Date(now.getTime() + estimatedWait * 60000);
  const expectedTime = expectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newPatient = {
    token,
    name: patientData.name,
    phone: patientData.phone,
    status: 'Waiting',
    estimatedWait,
    expectedTime,
    notificationType: patientData.notificationType || 'WhatsApp',
    isEmergency: patientData.isEmergency || false,
    arrivalTime: now.toISOString(),
  };

  if (newPatient.isEmergency) {
    queueData.activeTokens = [newPatient, ...(queueData.activeTokens || [])];
  } else {
    queueData.activeTokens = [...(queueData.activeTokens || []), newPatient];
  }

  await queueRef.update({
    lastToken: newTokenNum,
    activeTokens: queueData.activeTokens,
  });
  console.log('Backend: Token generated:', token);

  // Send Instant Welcome Message for testing
  if (newPatient.notificationType === 'WhatsApp') {
    sendWhatsAppNotification(newPatient.phone, `Hi ${newPatient.name}, your token is ${token}. Your turn is expected at ${expectedTime}. Track live: http://localhost:5173/status/${clinicId}/${token}`);
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

  // Update wait times for remaining
  const clinic = await Clinic.findById(clinicId);
  const avgWait = clinic ? clinic.averageConsultationTime : 15;
  const recalculatedTokens = updatedActiveTokens.map((p, index) => {
    const wait = index * avgWait;
    const expDate = new Date(new Date().getTime() + wait * 60000);
    return {
      ...p,
      estimatedWait: wait,
      expectedTime: expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  });

  // Notification Trigger: If a patient is now 3rd in line (index 2)
  if (recalculatedTokens.length >= 3) {
    const thirdPatient = recalculatedTokens[2];
    if (thirdPatient.notificationType === 'WhatsApp') {
      sendWhatsAppNotification(thirdPatient.phone, `Hi ${thirdPatient.name}, you are 3rd in line at ${clinic.name}. Your turn is expected at ${thirdPatient.expectedTime}. Please be ready!`);
    }
  }

  const currentServing = {
    ...nextPatient,
    status: 'Serving',
    startTime: new Date().toISOString()
  };

  // Notification Trigger: Your turn is NOW
  if (currentServing.notificationType === 'WhatsApp') {
    sendWhatsAppNotification(currentServing.phone, `🔔 IT'S YOUR TURN! Hi ${currentServing.name}, please proceed to the doctor's office now. (Token: ${currentServing.token})`);
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

const completeCurrentPatient = async (clinicId, doctorId) => {
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
    consultationDuration: completedPatient.startTime ? Math.round((new Date() - new Date(completedPatient.startTime)) / 60000) : 0
  });

  await queueRef.update({
    currentServing: null
  });

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
      if (p.notificationType === 'WhatsApp') {
        sendWhatsAppNotification(p.phone, `Notice: The doctor is taking a short break. Your estimated wait time may be slightly adjusted. Thank you for your patience!`);
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
