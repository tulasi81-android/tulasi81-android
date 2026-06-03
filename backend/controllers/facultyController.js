const Faculty = require('../models/Faculty');

// GET /api/faculty
exports.getAll = async (req, res) => {
  try {
    const { department, active, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const faculty = await Faculty.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 });

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/faculty/:id
exports.getById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('department', 'name code');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/faculty
exports.create = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    const populated = await faculty.populate('department', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/faculty/:id
exports.update = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/faculty/:id (soft delete)
exports.remove = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({ message: 'Faculty deactivated', faculty });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/faculty/bulk
exports.bulkCreate = async (req, res) => {
  try {
    const faculties = req.body; // Array of faculty objects
    if (!Array.isArray(faculties)) {
      return res.status(400).json({ message: 'Request body must be an array' });
    }

    const results = await Faculty.insertMany(faculties);
    res.status(201).json({
      message: `Successfully imported ${results.length} faculty members`,
      count: results.length
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
