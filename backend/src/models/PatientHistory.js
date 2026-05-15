const mongoose = require('mongoose');

const patientHistorySchema = mongoose.Schema(
  {
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    tokenNumber: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Completed', 'Absent', 'Cancelled'],
    },
    date: { type: Date, default: Date.now },
    consultationDuration: { type: Number }, // in minutes
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  },
  { timestamps: true }
);

const PatientHistory = mongoose.model('PatientHistory', patientHistorySchema);
module.exports = PatientHistory;
