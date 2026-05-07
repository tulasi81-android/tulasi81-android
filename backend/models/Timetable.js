const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  facultyName: { type: String, required: true, unique: true },
  schedule: { type: Map, of: Map } // Day -> TimeSlot -> Activity
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
