const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Duty = require('./models/Duty');
const Timetable = require('./models/Timetable');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- API Endpoints: Duties ---
app.get('/api/duties', async (req, res) => {
  try {
    const duties = await Duty.find().sort({ createdAt: -1 });
    res.json(duties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/duties', async (req, res) => {
  const duty = new Duty(req.body);
  try {
    const newDuty = await duty.save();
    res.status(201).json(newDuty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/duties/:id', async (req, res) => {
  try {
    const updatedDuty = await Duty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDuty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/duties/:id', async (req, res) => {
  try {
    await Duty.findByIdAndDelete(req.params.id);
    res.json({ message: 'Duty deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- API Endpoints: Timetables ---
app.get('/api/timetables', async (req, res) => {
  try {
    const timetables = await Timetable.find();
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/timetables', async (req, res) => {
  const { facultyName, schedule } = req.body;
  try {
    const updatedTT = await Timetable.findOneAndUpdate(
      { facultyName },
      { schedule },
      { upsert: true, new: true }
    );
    res.json(updatedTT);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
