import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Row, Col, Form, Button, Modal, 
  Table, Badge, Nav, Accordion, Card
} from 'react-bootstrap';
import { 
  FiPlus, FiSearch, FiCalendar, FiMapPin, FiClock, 
  FiTrash2, FiEdit2, FiCheckCircle, FiXCircle,
  FiChevronLeft, FiChevronRight, FiGrid, FiList,
  FiAlertCircle, FiBookOpen, FiLock, FiLogOut, FiUsers
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';

// --- Constants ---
const API_BASE_URL = 'http://localhost:5000/api';
const STATUS_OPTIONS = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];
const ROOM_OPTIONS = ['LH-01', 'LH-02', 'Auditorium', 'Lab-A', 'Lab-B', 'Conference Hall'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00'];

const App = () => {
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // --- App State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardView, setDashboardView] = useState('list');
  const [duties, setDuties] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFacultyForTT, setSelectedFacultyForTT] = useState('');

  const [formData, setFormData] = useState({
    facultyName: '', department: '', examName: '', 
    roomNo: '', date: '', startTime: '', 
    endTime: '', status: 'Scheduled'
  });

  // --- API Calls ---
  const fetchDuties = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/duties`);
      setDuties(res.data);
    } catch (err) {
      toast.error('Failed to fetch duties');
    }
  };

  const fetchTimetables = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/timetables`);
      const ttMap = {};
      res.data.forEach(tt => { ttMap[tt.facultyName] = tt.schedule; });
      setTimetables(ttMap);
    } catch (err) {
      toast.error('Failed to fetch timetables');
    }
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_auth');
    if (authStatus === 'true') setIsLoggedIn(true);
    
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDuties(), fetchTimetables()]);
      setLoading(false);
    };
    init();
  }, []);

  // --- Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'cse') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_auth', 'true');
      toast.success('Logged in successfully');
    } else {
      toast.error('Invalid credentials (admin / cse)');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_auth');
    toast.info('Logged out');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/duties/${currentDuty._id}`, formData);
        toast.success('Duty updated');
      } else {
        await axios.post(`${API_BASE_URL}/duties`, formData);
        toast.success('Duty allotted');
      }
      setShowModal(false);
      fetchDuties();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this duty?')) {
      try {
        await axios.delete(`${API_BASE_URL}/duties/${id}`);
        toast.info('Deleted');
        fetchDuties();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const updateTimetable = async (faculty, day, slot, value) => {
    const newSchedule = { ...(timetables[faculty] || {}) };
    if (!newSchedule[day]) newSchedule[day] = {};
    newSchedule[day][slot] = value;

    try {
      await axios.post(`${API_BASE_URL}/timetables`, { facultyName: faculty, schedule: newSchedule });
      setTimetables(prev => ({ ...prev, [faculty]: newSchedule }));
    } catch (err) {
      toast.error('Failed to update timetable');
    }
  };

  // --- Data Grouping ---
  const filteredDuties = useMemo(() => {
    return duties.filter(d => {
      const matchesSearch = d.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) || d.examName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
      const matchesDate = !filterDate || d.date === filterDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [duties, searchTerm, filterStatus, filterDate]);

  const dutiesByFaculty = useMemo(() => {
    const grouped = {};
    filteredDuties.forEach(d => {
      if (!grouped[d.facultyName]) grouped[d.facultyName] = [];
      grouped[d.facultyName].push(d);
    });
    return grouped;
  }, [filteredDuties]);

  const dutiesByDay = useMemo(() => {
    const grouped = {};
    filteredDuties.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(d => {
      if (!grouped[d.date]) grouped[d.date] = [];
      grouped[d.date].push(d);
    });
    return grouped;
  }, [filteredDuties]);

  if (!isLoggedIn) {
    return (
      <div className="login-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <img src="/college_logo.png" alt="Swarnandhra College" className="img-fluid rounded-lg shadow-sm mb-4" style={{ maxHeight: '180px', width: '100%', objectFit: 'cover' }} />
            <div className="brand-icon mx-auto mb-3" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}><FiLock /></div>
            <h3>EDAS Admin</h3>
            <p className="text-muted">Swarnandhra College of Engineering & Technology</p>
          </div>
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control placeholder="admin" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} /></Form.Group>
            <Form.Group className="mb-4"><Form.Label>Password</Form.Label><Form.Control type="password" placeholder="cse" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /></Form.Group>
            <Button variant="none" className="btn-primary-gradient w-100" type="submit">Sign In</Button>
          </Form>
        </div>
        <ToastContainer position="bottom-right" theme="dark" />
      </div>
    );
  }

  return (
    <div className="pb-5">
      <nav className="app-navbar mb-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div className="navbar-brand">
              <img src="/college_logo.png" alt="Logo" className="rounded me-2" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
              <div className="brand-icon"><FiGrid /></div>
              <span>EDAS Admin</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Nav variant="pills" className="bg-input rounded-pill p-1">
                <Nav.Item><Nav.Link active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} className="rounded-pill px-3">Dashboard</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} className="rounded-pill px-3">Timetables</Nav.Link></Nav.Item>
              </Nav>
              <Button variant="none" className="btn-ghost ms-2" onClick={handleLogout}><FiLogOut /></Button>
            </div>
          </div>
        </Container>
      </nav>

      <Container>
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2">Loading data...</p></div>
        ) : (
          activeTab === 'dashboard' ? (
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="btn-group bg-input p-1 rounded-pill">
                  <Button variant={dashboardView === 'list' ? 'primary' : 'none'} size="sm" className="rounded-pill px-3" onClick={() => setDashboardView('list')}><FiList className="me-1"/> List</Button>
                  <Button variant={dashboardView === 'faculty' ? 'primary' : 'none'} size="sm" className="rounded-pill px-3" onClick={() => setDashboardView('faculty')}><FiUsers className="me-1"/> Faculty</Button>
                  <Button variant={dashboardView === 'day' ? 'primary' : 'none'} size="sm" className="rounded-pill px-3" onClick={() => setDashboardView('day')}><FiCalendar className="me-1"/> Day</Button>
                </div>
                <Button variant="none" className="btn-primary-gradient" onClick={() => { setFormData({facultyName:'', department:'', examName:'', roomNo:'', date:'', startTime:'', endTime:'', status:'Scheduled'}); setIsEditing(false); setShowModal(true); }}><FiPlus /> New Allotment</Button>
              </div>

              {dashboardView === 'list' && (
                <div className="glass-panel">
                  <Table className="data-table">
                    <thead><tr><th>Faculty</th><th>Exam/Room</th><th>Date/Time</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                      {filteredDuties.map(d => (
                        <tr key={d._id}>
                          <td><div className="fw-bold">{d.facultyName}</div><small className="text-muted">{d.department}</small></td>
                          <td><div>{d.examName}</div><small className="text-primary-light">{d.roomNo}</small></td>
                          <td><div>{d.date}</div><small>{d.startTime}</small></td>
                          <td className="text-end">
                            <button className="btn-icon edit" onClick={() => { setFormData(d); setCurrentDuty(d); setIsEditing(true); setShowModal(true); }}><FiEdit2 /></button>
                            <button className="btn-icon delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {dashboardView === 'faculty' && (
                <Accordion defaultActiveKey="0">
                  {Object.entries(dutiesByFaculty).map(([faculty, facultyDuties], idx) => (
                    <Accordion.Item eventKey={idx.toString()} key={faculty} className="mb-3 border-0 rounded overflow-hidden">
                      <Accordion.Header><div className="d-flex align-items-center w-100 justify-content-between pe-3"><span className="fw-bold">{faculty}</span><Badge bg="primary" pill>{facultyDuties.length}</Badge></div></Accordion.Header>
                      <Accordion.Body className="bg-card">
                        <Table className="data-table mb-0"><tbody>
                          {facultyDuties.map(d => (
                            <tr key={d._id}><td>{d.examName}</td><td>{d.roomNo}</td><td>{d.date}</td><td>{d.startTime}</td>
                              <td className="text-end">
                                <button className="btn-icon edit me-2" onClick={() => { setFormData(d); setCurrentDuty(d); setIsEditing(true); setShowModal(true); }}><FiEdit2 /></button>
                                <button className="btn-icon delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody></Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}

              {dashboardView === 'day' && (
                <Row className="g-4">
                  {Object.entries(dutiesByDay).map(([date, dayDuties]) => (
                    <Col md={6} lg={4} key={date}>
                      <Card className="glass-panel h-100">
                        <Card.Header className="bg-transparent border-0 d-flex justify-content-between"><span className="fw-bold text-primary-light">{new Date(date).toDateString()}</span><Badge bg="info">{dayDuties.length}</Badge></Card.Header>
                        <Card.Body className="p-0">
                          {dayDuties.map(d => (
                            <div key={d._id} className="p-3 border-bottom border-color">
                              <div className="d-flex justify-content-between mb-1"><span className="fw-medium">{d.facultyName}</span><small className="text-muted">{d.startTime}</small></div>
                              <small className="d-block text-muted">{d.examName} • {d.roomNo}</small>
                            </div>
                          ))}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          ) : (
            <div className="fade-in">
              <div className="glass-panel">
                 <h5>Timetable Management</h5>
                 <Form.Select className="mb-4" onChange={(e) => setSelectedFacultyForTT(e.target.value)}>
                   <option value="">Select Faculty</option>
                   {[...new Set(duties.map(d => d.facultyName))].map(f => <option key={f} value={f}>{f}</option>)}
                 </Form.Select>
                 {selectedFacultyForTT && (
                   <div className="table-responsive">
                      <Table bordered className="timetable-grid">
                        <thead><tr><th>Slot</th>{DAYS.map(day => <th key={day}>{day}</th>)}</tr></thead>
                        <tbody>
                          {TIME_SLOTS.map(slot => (
                            <tr key={slot}>
                              <td className="small fw-bold">{slot}</td>
                              {DAYS.map(day => (
                                <td key={day} className="p-1">
                                  <Form.Control size="sm" value={timetables[selectedFacultyForTT]?.[day]?.[slot] || ''} onChange={e => updateTimetable(selectedFacultyForTT, day, slot, e.target.value)} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                   </div>
                 )}
              </div>
            </div>
          )
        )}
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'New Allotment'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}><Form.Label>Faculty</Form.Label><Form.Control value={formData.facultyName} onChange={e => setFormData({...formData, facultyName: e.target.value})}/></Col>
              <Col md={6}><Form.Label>Department</Form.Label><Form.Control value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}/></Col>
              <Col md={6}><Form.Label>Exam</Form.Label><Form.Control value={formData.examName} onChange={e => setFormData({...formData, examName: e.target.value})}/></Col>
              <Col md={6}><Form.Label>Room</Form.Label><Form.Select value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})}>{ROOM_OPTIONS.map(r => <option key={r}>{r}</option>)}</Form.Select></Col>
              <Col md={4}><Form.Label>Date</Form.Label><Form.Control type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/></Col>
              <Col md={4}><Form.Label>Start</Form.Label><Form.Control type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}/></Col>
              <Col md={4}><Form.Label>End</Form.Label><Form.Control type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}/></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer><Button variant="none" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="none" className="btn-primary-gradient" type="submit">Submit</Button></Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer position="bottom-right" theme="dark" />
      <style>{`
        .login-container { background: var(--bg-body); position: relative; z-index: 100; }
        .bg-card { background-color: var(--bg-card) !important; }
        .accordion-button { background: var(--bg-input) !important; color: var(--text-primary) !important; box-shadow: none !important; }
        .accordion-button:not(.collapsed) { color: var(--primary-light) !important; }
        .nav-link { color: var(--text-secondary); transition: 0.3s; }
        .nav-link.active { background: var(--primary) !important; color: white !important; }
        .btn-primary-gradient:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default App;
