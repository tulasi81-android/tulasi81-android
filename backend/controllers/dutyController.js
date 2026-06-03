const Duty = require('../models/Duty');

// GET /api/duties
exports.getAll = async (req, res) => {
  try {
    const { status, date, search, facultyName } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (date) filter.date = date;
    if (facultyName) filter.facultyName = { $regex: facultyName, $options: 'i' };
    if (search) {
      filter.$or = [
        { facultyName: { $regex: search, $options: 'i' } },
        { examName: { $regex: search, $options: 'i' } },
        { roomNo: { $regex: search, $options: 'i' } }
      ];
    }

    const duties = await Duty.find(filter).sort({ createdAt: -1 });
    res.json(duties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/duties/stats
exports.getStats = async (req, res) => {
  try {
    const total = await Duty.countDocuments();
    const scheduled = await Duty.countDocuments({ status: 'Scheduled' });
    const ongoing = await Duty.countDocuments({ status: 'Ongoing' });
    const completed = await Duty.countDocuments({ status: 'Completed' });
    const cancelled = await Duty.countDocuments({ status: 'Cancelled' });

    // Faculty with most duties
    const topFaculty = await Duty.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$facultyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Duties per date (last 7 dates)
    const dutiesByDate = await Duty.aggregate([
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    res.json({
      total,
      scheduled,
      ongoing,
      completed,
      cancelled,
      topFaculty,
      dutiesByDate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/duties/:id
exports.getById = async (req, res) => {
  try {
    const duty = await Duty.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({ message: 'Duty not found' });
    }
    res.json(duty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/duties
exports.create = async (req, res) => {
  try {
    const duty = await Duty.create(req.body);
    res.status(201).json(duty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/duties/:id
exports.update = async (req, res) => {
  try {
    const duty = await Duty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!duty) {
      return res.status(404).json({ message: 'Duty not found' });
    }

    res.json(duty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/duties/:id
exports.remove = async (req, res) => {
  try {
    const duty = await Duty.findByIdAndDelete(req.params.id);
    if (!duty) {
      return res.status(404).json({ message: 'Duty not found' });
    }
    res.json({ message: 'Duty deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
