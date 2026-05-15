const mongoose = require('mongoose');

const clinicSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    operatingHours: { type: String, required: true },
    averageConsultationTime: { type: Number, default: 15 }, // in minutes
  },
  { timestamps: true }
);

const Clinic = mongoose.model('Clinic', clinicSchema);
module.exports = Clinic;
