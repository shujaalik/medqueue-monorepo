const Clinic = require('../models/Clinic');
const PatientHistory = require('../models/PatientHistory');
const { db } = require('../config/firebase');

const getDashboardStats = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const completed = await PatientHistory.countDocuments({ clinicId, status: 'Completed' });
    const absent = await PatientHistory.countDocuments({ clinicId, status: 'Absent' });
    const cancelled = await PatientHistory.countDocuments({ clinicId, status: 'Cancelled' });

    // Get live waiting count from Firebase
    const queueRef = db().ref(`queues/${clinicId}/activeTokens`);
    const snapshot = await queueRef.once('value');
    const waiting = snapshot.val() ? snapshot.val().length : 0;

    // Avg Wait Time (from completed records)
    const history = await PatientHistory.find({ clinicId, status: 'Completed' });
    const avgConsultation = history.length > 0 
      ? history.reduce((acc, curr) => acc + (curr.consultationDuration || 0), 0) / history.length
      : 0;

    // Charts data: Visits per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await PatientHistory.aggregate([
      { $match: { clinicId: new (require('mongoose').Types.ObjectId)(clinicId), date: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: {
        totalVisits: completed + absent + cancelled + waiting,
        completed,
        waiting,
        absent,
        cancelled,
        avgConsultation: Math.round(avgConsultation)
      },
      chartData: chartData.map(d => ({ date: d._id, visits: d.count }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClinicInfo = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId);
    if (clinic) {
      res.json(clinic);
    } else {
      res.status(404).json({ message: 'Clinic not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getClinicInfo };
