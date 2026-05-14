const mongoose = require('mongoose');

const DutySchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  // Keep facultyName for backward compatibility & quick display
  facultyName: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  examName: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  roomNo: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  allotmentType: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  }
}, { timestamps: true });

// Index for efficient querying
DutySchema.index({ date: 1, status: 1 });
DutySchema.index({ faculty: 1, date: 1 });

module.exports = mongoose.model('Duty', DutySchema);
