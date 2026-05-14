const XLSX = require('xlsx');

const data = [
  { Name: 'Dr. John Doe', Branch: 'CSE', Qualification: 'PhD', Designation: 'Professor', Email: 'john@example.com' },
  { Name: 'Jane Smith', Branch: 'IT', Qualification: 'M.Tech', Designation: 'Assistant Professor', Email: 'jane@example.com' },
  { Name: 'Alan Turing', Branch: 'AIML', Qualification: 'PhD', Designation: 'HOD', Email: 'alan@example.com' }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Faculty');
XLSX.writeFile(wb, '../sample_faculty.xlsx');
console.log('Sample created at tulasi81-android/sample_faculty.xlsx');
