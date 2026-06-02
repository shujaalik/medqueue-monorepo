const Clinic = require('../models/Clinic');
const PatientHistory = require('../models/PatientHistory');
const { db } = require('../config/firebase');
const { analyzeClinicTrends } = require('../services/aiService');

const getDashboardStats = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Security check: ClinicAdmin can only query their own clinicId
    if (req.user && req.user.role === 'ClinicAdmin' && req.user.clinicId.toString() !== clinicId) {
      return res.status(403).json({ message: 'Not authorized to view other clinic metrics' });
    }

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

    // Hourly traffic data (last 7 days)
    const hourlyAggregation = await PatientHistory.aggregate([
      { $match: { clinicId: new (require('mongoose').Types.ObjectId)(clinicId), date: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $hour: "$date" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedHourlyData = Array.from({ length: 24 }, (_, h) => {
      const visit = hourlyAggregation.find(item => item._id === h);
      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        visits: visit ? visit.count : 0
      };
    }).filter(h => h.visits > 0 || (parseInt(h.hour) >= 9 && parseInt(h.hour) <= 18));

    // Doctor Performance Metrics
    const doctorData = await PatientHistory.aggregate([
      { $match: { clinicId: new (require('mongoose').Types.ObjectId)(clinicId), status: 'Completed', doctorId: { $exists: true, $ne: null } } },
      { $group: {
          _id: "$doctorId",
          patientsServed: { $sum: 1 },
          avgDuration: { $avg: "$consultationDuration" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: "$doctorInfo" },
      { $project: {
          _id: 1,
          patientsServed: 1,
          avgDuration: { $round: ["$avgDuration", 1] },
          doctorName: "$doctorInfo.name"
        }
      }
    ]);

    // Recent Patient History Log (last 10 consultations)
    const recentHistory = await PatientHistory.find({ clinicId })
      .sort({ date: -1 })
      .limit(10)
      .populate('doctorId', 'name');

    res.json({
      summary: {
        totalVisits: completed + absent + cancelled + waiting,
        completed,
        waiting,
        absent,
        cancelled,
        avgConsultation: Math.round(avgConsultation)
      },
      chartData: chartData.map(d => ({ date: d._id, visits: d.count })),
      hourlyData: formattedHourlyData,
      doctorData,
      recentHistory: recentHistory.map(h => ({
        _id: h._id,
        patientName: h.patientName,
        phone: h.phone,
        tokenNumber: h.tokenNumber,
        status: h.status,
        date: h.date,
        consultationDuration: h.consultationDuration,
        doctorName: h.doctorId?.name || 'Unassigned'
      }))
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

const getClinicAIAnalysis = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Security check: ClinicAdmin can only query their own clinicId
    if (req.user && req.user.role === 'ClinicAdmin' && req.user.clinicId.toString() !== clinicId) {
      return res.status(403).json({ message: 'Not authorized to view other clinic analyses' });
    }

    // Query last 50 completed records for this clinic
    const completedRecords = await PatientHistory.find({ 
      clinicId, 
      status: 'Completed',
      $or: [
        { diagnosis: { $exists: true, $ne: '' } },
        { symptoms: { $exists: true, $ne: [] } }
      ]
    })
    .sort({ date: -1 })
    .limit(50)
    .select('symptoms diagnosis');

    if (completedRecords.length === 0) {
      return res.json({
        topDiseases: [],
        severityDistribution: "Undetermined - no completed consultations recorded yet.",
        aiInsights: ["Register and finish patient consultations to populate epidemiological trend analysis."]
      });
    }

    const cases = completedRecords.map(r => ({
      symptoms: r.symptoms,
      diagnosis: r.diagnosis
    }));

    const analysis = await analyzeClinicTrends(cases);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getClinicInfo, getClinicAIAnalysis };
