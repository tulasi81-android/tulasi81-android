const Duty = require('../models/Duty');
const Timetable = require('../models/Timetable');

const ROOM_OPTIONS = ['LH-01', 'LH-02', 'Auditorium', 'Lab-A', 'Lab-B', 'Conference Hall'];

/**
 * Auto-Allotment Engine
 * 
 * Algorithm:
 * 1. Get all faculty from timetables
 * 2. For the given date, determine the day of week
 * 3. Filter out faculty who are busy in their timetable on that day
 * 4. Filter out faculty who already have a conflicting duty at the same time
 * 5. Sort remaining faculty by least existing duty load (fairness)
 * 6. Pick the top N faculty (where N = roomsNeeded)
 * 7. Create duty records for each
 * 
 * @param {Object} params
 * @param {string} params.examName - Name of the exam
 * @param {string} params.date - Date string (YYYY-MM-DD)
 * @param {string} params.startTime - Start time (HH:mm)
 * @param {string} params.endTime - End time (HH:mm)
 * @param {number} params.roomsNeeded - Number of rooms/faculty needed
 * @returns {Object} Result with allotted duties or error
 */
async function runAutoAllotment({ examName, date, startTime, endTime, roomsNeeded }) {
  // Validation
  if (!examName || !date || !startTime || !endTime || !roomsNeeded) {
    return { success: false, message: 'All fields are required: examName, date, startTime, endTime, roomsNeeded' };
  }

  if (roomsNeeded < 1 || roomsNeeded > 20) {
    return { success: false, message: 'roomsNeeded must be between 1 and 20' };
  }

  // Step 1: Get all timetables
  const timetables = await Timetable.find();
  if (timetables.length === 0) {
    return { success: false, message: 'No faculty timetables found. Please add faculty schedules first.' };
  }

  // Build timetable lookup: { facultyName: schedule }
  const ttMap = {};
  timetables.forEach(tt => {
    ttMap[tt.facultyName] = tt.schedule;
  });

  const allFaculties = Object.keys(ttMap);

  // Step 2: Get the day name for conflict checking
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

  // Step 3: Get all existing duties for load calculation
  const allDuties = await Duty.find({ status: { $ne: 'Cancelled' } });

  // Step 4: Calculate current load per faculty
  const facultyLoad = {};
  allFaculties.forEach(f => {
    facultyLoad[f] = allDuties.filter(d => d.facultyName === f).length;
  });

  // Step 5: Filter available faculty
  const availableFaculty = allFaculties.filter(f => {
    // Check 1: Timetable conflict — is faculty busy on this day?
    const schedule = ttMap[f];
    if (schedule) {
      const daySchedule = schedule instanceof Map ? schedule.get(dayName) : schedule[dayName];
      if (daySchedule) {
        const slots = daySchedule instanceof Map ? Array.from(daySchedule.values()) : Object.values(daySchedule);
        const isBusy = slots.some(val => val && val.trim() !== '');
        if (isBusy) return false;
      }
    }

    // Check 2: Existing duty conflict at the same date/time
    const hasConflict = allDuties.some(d =>
      d.facultyName === f &&
      d.date === date &&
      ((startTime >= d.startTime && startTime < d.endTime) ||
       (endTime > d.startTime && endTime <= d.endTime) ||
       (startTime <= d.startTime && endTime >= d.endTime))
    );
    if (hasConflict) return false;

    return true;
  });

  // Step 6: Sort by least load for fairness
  availableFaculty.sort((a, b) => facultyLoad[a] - facultyLoad[b]);

  if (availableFaculty.length < roomsNeeded) {
    return {
      success: false,
      message: `Not enough available faculty. Found ${availableFaculty.length} but need ${roomsNeeded}.`,
      availableCount: availableFaculty.length,
      availableFaculty
    };
  }

  // Step 7: Create duties for selected faculty
  const Faculty = require('../models/Faculty');
  const allottedDuties = [];
  for (let i = 0; i < roomsNeeded; i++) {
    const selectedFaculty = availableFaculty[i];
    
    const facultyRecord = await Faculty.findOne({ name: selectedFaculty }).populate('department');
    if (!facultyRecord) continue;

    const newDuty = await Duty.create({
      faculty: facultyRecord._id,
      facultyName: selectedFaculty,
      department: facultyRecord.department ? facultyRecord.department.code : 'N/A',
      examName,
      roomNo: ROOM_OPTIONS[i % ROOM_OPTIONS.length],
      date,
      startTime,
      endTime,
      status: 'Scheduled',
      allotmentType: 'auto'
    });
    allottedDuties.push(newDuty);
  }

  return {
    success: true,
    message: `Successfully auto-allotted ${roomsNeeded} duties`,
    allottedTo: availableFaculty.slice(0, roomsNeeded),
    duties: allottedDuties
  };
}

module.exports = { runAutoAllotment };
