const Department = require('../models/Department');

// GET /api/departments
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/departments
exports.create = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/departments/:id
exports.remove = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
