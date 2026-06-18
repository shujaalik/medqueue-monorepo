const { db } = require('../config/firebase');
const Clinic = require('../models/Clinic');
const { sendWhatsAppNotification } = require('./whatsappService');
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

const initQueueMonitor = () => {
  console.log('⏰ Queue Monitor service initialized.');
  
  // Monitor active queues every 30 seconds
  setInterval(async () => {
    try {
      const queuesRef = db().ref('queues');
      const snapshot = await queuesRef.once('value');
      const queues = snapshot.val();
      
      if (!queues) return;
      
      const now = new Date();
      
      for (const clinicId of Object.keys(queues)) {
        const queueData = queues[clinicId];
        
        if (!queueData) continue;
        
        // Convert activeTokens object/array to array
        const activeTokens = queueData.activeTokens 
          ? Object.values(queueData.activeTokens).filter(Boolean) 
          : [];
          
        if (activeTokens.length === 0) continue;
        
        // 1. Fetch clinic avg consultation time
        const clinic = await Clinic.findById(clinicId);
        const avgWait = clinic ? clinic.averageConsultationTime : 15;
        
        // 2. Determine expected start time of the next patient
        let expectedStartOfNext;
        if (queueData.isBreak) {
          // Doctor is on break: queue is paused, next patient starts in 10 minutes
          expectedStartOfNext = now.getTime() + 10 * 60000;
        } else if (
          queueData.currentServing &&
          queueData.currentServing.status === 'Serving' &&
          queueData.currentServing.startTime
        ) {
          // Doctor is serving: next patient starts after current patient finishes
          const startTime = new Date(queueData.currentServing.startTime);
          const elapsedMs = now.getTime() - startTime.getTime();
          const elapsedMinutes = Math.floor(elapsedMs / 60000);
          const remainingServingTime = Math.max(0, avgWait - elapsedMinutes);
          expectedStartOfNext = now.getTime() + remainingServingTime * 60000;
        } else {
          // Doctor is idle: next patient can start immediately
          expectedStartOfNext = now.getTime();
        }
        
        let changed = false;
        const updatedTokens = [];
        
        for (let i = 0; i < activeTokens.length; i++) {
          const p = activeTokens[i];
          
          let wait, newExpectedTimeStr;
          if (p.isEmergency) {
            wait = 0;
            newExpectedTimeStr = 'ASAP';
          } else {
            wait = Math.max(0, Math.round((expectedStartOfNext + (i * avgWait * 60000) - now.getTime()) / 60000));
            const expDate = new Date(now.getTime() + wait * 60000);
            newExpectedTimeStr = expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          
          // Initialize tracking properties if missing
          const initialTimestamp = p.initialExpectedTimestamp || (now.getTime() + (p.estimatedWait || 0) * 60000);
          const lastNotified = p.lastDelayNotified || 0;
          
          // Delay in minutes compared to initial expected time
          let currentDelay = 0;
          if (!p.isEmergency) {
            const expDate = new Date(now.getTime() + wait * 60000);
            currentDelay = Math.max(0, Math.floor((expDate.getTime() - initialTimestamp) / 60000));
          }
          
          let nextLastNotified = lastNotified;
          let shouldNotify = false;
          
          // If delayed by at least 10 minutes and delay has increased by at least 10 mins since last alert
          if (!p.isEmergency && currentDelay >= 10 && (currentDelay - lastNotified) >= 10) {
            shouldNotify = true;
            nextLastNotified = Math.floor(currentDelay / 10) * 10;
          }
          
          // Check if values changed
          if (
            p.estimatedWait !== wait ||
            p.expectedTime !== newExpectedTimeStr ||
            p.initialExpectedTimestamp !== initialTimestamp ||
            p.lastDelayNotified !== nextLastNotified
          ) {
            changed = true;
          }
          
          const updatedPatient = {
            ...p,
            estimatedWait: wait,
            expectedTime: newExpectedTimeStr,
            initialExpectedTimestamp: initialTimestamp,
            lastDelayNotified: nextLastNotified
          };
          
          updatedTokens.push(updatedPatient);
          
          // Send delay notification
          if (shouldNotify) {
            if (p.notificationType === 'WhatsApp') {
              const delayMessage = `📋 *MEDQUEUE CLINIC UPDATE*\n----------------------------------------\nHi *${p.name}*, the doctor is currently handling a detailed consultation.\n\nYour expected turn time for Token *${p.token}* has been adjusted to *${newExpectedTimeStr}* (delayed by approx. *${currentDelay}* mins).\n\nTrack live status here: ${getFrontendUrl()}/status/${clinicId}/${p.token}\n----------------------------------------\nThank you for your patience!`;
              sendWhatsAppNotification(p.phone, delayMessage);
            } else if (p.notificationType === 'SMS') {
              const smsMessage = `📋 MedQueue Update: Turn for ${p.token} adjusted to ${newExpectedTimeStr} (delayed by ~${currentDelay}m). Track: ${getFrontendUrl()}/status/${clinicId}/${p.token}`;
              sendSMS(p.phone, smsMessage);
            }
          }
        }
        
        // 3. Write back to Firebase if any values were updated
        if (changed) {
          console.log(`⏰ Queue Monitor: Updating ETAs for clinic ${clinicId}`);
          await db().ref(`queues/${clinicId}/activeTokens`).set(updatedTokens);
        }
      }
    } catch (error) {
      console.error('❌ Error in Queue Monitor background process:', error);
    }
  }, 30000); // Run check every 30 seconds
};

module.exports = { initQueueMonitor };
