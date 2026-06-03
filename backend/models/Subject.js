const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true,
    default: 'Unknown Semester'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
