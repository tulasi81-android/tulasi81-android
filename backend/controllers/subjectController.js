const Subject = require('../models/Subject');
const pdfParse = require('pdf-parse');

exports.getAll = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('department', 'name code').sort({ semester: 1, code: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newSub = new Subject(req.body);
    await newSub.save();
    res.status(201).json(newSub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const lines = text.split('\n');
    let currentSemester = 'Semester 1'; // Default
    const parsedSubjects = [];

    // Regex to match "CS101", "CS-101", "CS 101" followed by text
    const subjectRegex = /^([A-Z]{2,4}[-\s]?\d{3,4})[:\-\s]+(.+)$/i;
    const semesterRegex = /semester\s*([0-9ivx]+)/i;
    const semAbbrevRegex = /sem\s*([0-9ivx]+)/i;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const semMatch = line.match(semesterRegex) || line.match(semAbbrevRegex);
      if (semMatch && line.length < 30) {
        currentSemester = `Semester ${semMatch[1].toUpperCase()}`;
        continue;
      }

      const subMatch = line.match(subjectRegex);
      if (subMatch) {
        const code = subMatch[1].replace(/\s+/g, '').toUpperCase();
        let name = subMatch[2].trim();
        name = name.replace(/\s+\d+(\.\d+)?$/, '').trim();

        if (!parsedSubjects.find(s => s.code === code)) {
          parsedSubjects.push({ code, name, semester: currentSemester });
        }
      }
    }

    if (parsedSubjects.length === 0) {
      return res.status(400).json({ 
        message: 'Could not detect any subjects. Ensure lines look like "CS101 Data Structures".' 
      });
    }

    const operations = parsedSubjects.map(sub => ({
      updateOne: { filter: { code: sub.code }, update: sub, upsert: true }
    }));

    const result = await Subject.bulkWrite(operations);

    res.status(201).json({
      message: `Successfully imported ${parsedSubjects.length} subjects.`,
      result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error parsing PDF: ' + err.message });
  }
};
