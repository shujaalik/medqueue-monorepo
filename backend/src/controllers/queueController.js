const { 
  registerPatient, 
  callNextPatient, 
  markAbsent, 
  resetQueue, 
  completeCurrentPatient, 
  toggleBreak 
} = require('../services/queueEngine');

const addPatient = async (req, res) => {
  try {
    const { clinicId, name, phone, isEmergency, notificationType } = req.body;
    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID is required' });
    }
    const patient = await registerPatient(clinicId, { name, phone, isEmergency, notificationType });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const nextPatient = async (req, res) => {
  try {
    const { clinicId } = req.body;
    const doctorId = req.user._id;
    const patient = await callNextPatient(clinicId, doctorId);
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setAbsent = async (req, res) => {
  try {
    const { clinicId, token } = req.body;
    await markAbsent(clinicId, token);
    res.json({ message: 'Patient marked as absent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearQueue = async (req, res) => {
  try {
    const { clinicId } = req.body;
    await resetQueue(clinicId);
    res.json({ message: 'Queue reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const finishSession = async (req, res) => {
  try {
    const { clinicId } = req.body;
    const doctorId = req.user._id;
    const patient = await completeCurrentPatient(clinicId, doctorId);
    res.json({ message: 'Session completed', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setBreak = async (req, res) => {
  try {
    const { clinicId, isBreak } = req.body;
    await toggleBreak(clinicId, isBreak);
    res.json({ message: `Break status updated to ${isBreak}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPatient,
  nextPatient,
  setAbsent,
  clearQueue,
  finishSession,
  setBreak
};
