const Timetable = require('../models/Timetable');

// GET /api/timetables
exports.getAll = async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ facultyName: 1 });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/timetables/:facultyName
exports.getByFaculty = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ facultyName: req.params.facultyName });
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found for this faculty' });
    }
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/timetables (create or update — upsert)
exports.createOrUpdate = async (req, res) => {
  try {
    const { facultyName, schedule } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      { facultyName },
      { schedule },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(timetable);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/timetables/:id
exports.remove = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json({ message: 'Timetable deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/timetables/bulk
exports.bulkImport = async (req, res) => {
  try {
    const { timetables } = req.body; // Array of { facultyName, schedule }
    if (!Array.isArray(timetables)) {
      return res.status(400).json({ message: 'Request body must contain a timetables array' });
    }

    const operations = timetables.map(tt => ({
      updateOne: {
        filter: { facultyName: tt.facultyName },
        update: { schedule: tt.schedule },
        upsert: true
      }
    }));

    const result = await Timetable.bulkWrite(operations);
    res.status(201).json({
      message: `Successfully imported ${result.upsertedCount + result.modifiedCount} timetables`,
      result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
