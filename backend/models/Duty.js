const mongoose = require('mongoose');

const DutySchema = new mongoose.Schema({
  facultyName: { type: String, required: true },
  department: { type: String, required: true },
  examName: { type: String, required: true },
  roomNo: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, default: 'Scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Duty', DutySchema);
