const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  // Keep facultyName for backward compatibility
  facultyName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  schedule: {
    type: Map,
    of: {
      type: Map,
      of: String
    }
  } // Day -> TimeSlot -> Activity
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
