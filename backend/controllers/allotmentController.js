const { runAutoAllotment } = require('../utils/allotmentEngine');

// POST /api/allotment/run
exports.run = async (req, res) => {
  try {
    const { examName, date, startTime, endTime, roomsNeeded } = req.body;

    const result = await runAutoAllotment({
      examName,
      date,
      startTime,
      endTime,
      roomsNeeded: parseInt(roomsNeeded)
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
