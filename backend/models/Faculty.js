const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  designation: {
    type: String,
    trim: true,
    default: 'Assistant Professor'
  },
  qualification: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Virtual: populate duties count
FacultySchema.virtual('dutyCount', {
  ref: 'Duty',
  localField: '_id',
  foreignField: 'faculty',
  count: true
});

// Ensure virtuals are included in JSON
FacultySchema.set('toJSON', { virtuals: true });
FacultySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Faculty', FacultySchema);
