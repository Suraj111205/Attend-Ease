const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const mongoURI = 'mongodb+srv://admin:admin123@cluster0.syerwma.mongodb.net/';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


const studentSchema = new mongoose.Schema({
  name: String,
  rollno: String,
  age: String,
  course: String,
  phone: String,
  enrolledAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);


app.post('/api/students', async (req, res) => {
  const { name, rollno, age, course, phone } = req.body;

  if (!name || !rollno || !age || !course || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingStudent = await Student.findOne({ rollno, course });
    if (existingStudent) {
      return res.status(400).json({ message: "A student with this Roll No is already registered for this course!" });
    }

    const newStudent = new Student({ name, rollno, age, course, phone });
    await newStudent.save();
    res.status(200).json({ message: "Student saved to database!" });
  } catch (err) {
    console.error("Error saving student:", err);
    res.status(500).json({ message: "Failed to save student" });
  }
});

app.get('/api/students/check/:rollno', async (req, res) => {
  try {
    const { course } = req.query;
    const query = { rollno: req.params.rollno };
    if (course) query.course = course;

    const student = await Student.findOne(query);
    res.json({ exists: !!student });
  } catch (err) {
    console.error("Error checking student existence:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ enrolledAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Delete associated attendance logs strictly for this rollno and course
    await AttendanceLog.deleteMany({ rollno: deletedStudent.rollno, course: deletedStudent.course });
    await PeriodwiseAttendanceLog.deleteMany({ rollno: deletedStudent.rollno, course: deletedStudent.course });

    res.status(200).json({ message: "Student enrollment deleted successfully!" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

app.post('/api/student/login', async (req, res) => {
  const { rollno, name } = req.body;
  if (!rollno || !name) {
    return res.status(400).json({ message: "Roll No and Name are required" });
  }
  try {
    const student = await Student.findOne({ rollno, name: { $regex: new RegExp('^' + name + '$', 'i') } });
    if (!student) {
      return res.status(401).json({ message: "Invalid Roll No or Name" });
    }
    res.status(200).json({ message: "Login successful", student });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/student/:rollno/dashboard', async (req, res) => {
  const { rollno } = req.params;
  try {
    const student = await Student.findOne({ rollno });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const dailyLogs = await AttendanceLog.find({ rollno }).sort({ recognizedAt: -1 });
    const periodLogs = await PeriodwiseAttendanceLog.find({ rollno }).sort({ recognizedAt: -1 });

    // Simple mock calculation for aggregate presence (number of logs * 5% just for UI flair)
    // Real logic would divide by total days the course occurred 
    let aggregatePresence = Math.min(100, Math.max(0, 75 + dailyLogs.length * 2));

    const periodCounts = {};
    periodLogs.forEach(log => {
      periodCounts[log.period] = (periodCounts[log.period] || 0) + 1;
    });

    // For flair, calculate a percentage based on an assumed 20 total classes so far
    const subjectAttendance = Object.keys(periodCounts).map(subject => ({
      subject,
      attended: periodCounts[subject],
      percentage: Math.min(100, Math.round((periodCounts[subject] / 20) * 100))
    }));

    const now = new Date();
    // Use a 6-hour buffer before the UTC month/week boundary to safely include
    // logs from IST timezone (UTC+5:30) that would otherwise be cut off.
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(startOfMonth.getHours() - 6); // buffer for IST offset

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(sevenDaysAgo.getHours() - 6); // buffer for IST offset

    res.json({
      student,
      recentDailyLogs: dailyLogs.slice(0, 5),
      recentPeriodLogs: periodLogs.filter(log => new Date(log.recognizedAt) >= sevenDaysAgo),
      monthlyPeriodLogs: periodLogs.filter(log => new Date(log.recognizedAt) >= startOfMonth),
      subjectAttendance,
      aggregatePresence
    });
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

///////////////new log for attence storage////////

app.get('/api/attendance', async (req, res) => {
  try {
    const logs = await AttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch attendance logs" });
  }
});


const attendanceLogSchema = new mongoose.Schema({
  rollno: String,
  name: String,
  course: String,
  recognizedAt: { type: Date, default: Date.now }
});

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

app.post('/api/attendance', async (req, res) => {
  const { rollno, name, course, recognizedAt } = req.body;

  if (!rollno) {
    return res.status(400).json({ message: "Roll No is required" });
  }

  try {
    let studentQuery = { rollno };
    if (course) studentQuery.course = course;

    let student = await Student.findOne(studentQuery);

    // If no student found, but name & course provided => allow manual entry
    if (!student && (!name || !course)) {
      return res.status(404).json({ message: "Student not found, and insufficient manual data provided" });
    }

    // Determine the current date (or use recognizedAt if provided)
    const today = new Date().toISOString().split('T')[0];
    const recognizedDate = recognizedAt ? new Date(recognizedAt) : new Date();
    const resolvedCourse = student ? student.course : course;
    const resolvedName = student ? student.name : name;

    // Check for existing attendance on the same day specifically for THIS course
    const existingLog = await AttendanceLog.findOne({
      rollno,
      course: resolvedCourse,
      recognizedAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });

    if (existingLog) {
      return res.status(400).json({ message: `Attendance for ${resolvedCourse} already recorded today` });
    }

    // Use data from the DB or from manual fields
    const log = new AttendanceLog({
      rollno,
      name: resolvedName,
      course: resolvedCourse,
      recognizedAt: recognizedDate
    });

    await log.save();

    res.status(200).json({ message: "Attendance logged successfully" });
  } catch (err) {
    console.error("Error logging attendance:", err);
    res.status(500).json({ message: "Failed to log attendance" });
  }
});



///////////////////////admin login and signup///////////
const AdminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", AdminSchema);


app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newAdmin = new Admin({
      username,
      email,
      password, // no hashing
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/////////////////signin.///////
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "Signin successful", admin: { username: admin.username, email: admin.email } });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


const periodwiseAttendanceLogSchema = new mongoose.Schema({
  rollno: String,
  name: String,
  course: String,
  period: String,
  recognizedAt: { type: Date, default: Date.now }
});

const PeriodwiseAttendanceLog = mongoose.model('PeriodwiseAttendanceLog', periodwiseAttendanceLogSchema);

app.post('/api/periodwise-attendance', async (req, res) => {
  const { rollno, recognizedAt, period: requestPeriod } = req.body; // Accept period from frontend

  console.log("Incoming data:", req.body); // 🔍 Debugging

  if (!rollno) {
    return res.status(400).json({ message: "Roll No is required" });
  }

  try {
    const student = await Student.findOne({ rollno });

    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    const now = recognizedAt ? new Date(recognizedAt) : new Date();
    const period = requestPeriod || 'No Period'; // Rely directly on the requested period name

    console.log("Calculated period:", period); // 🔍

    if (period === 'No Period') {
      return res.status(400).json({ message: "No valid class period at this time" });
    }

    const today = new Date(now.toISOString().split('T')[0]);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingLog = await PeriodwiseAttendanceLog.findOne({
      rollno,
      period,
      recognizedAt: { $gte: today, $lt: tomorrow }
    });

    if (existingLog) {
      return res.status(400).json({ message: `Attendance already recorded for ${period} today` });
    }

    const log = new PeriodwiseAttendanceLog({
      rollno,
      name: student.name,
      course: student.course,
      period,
      recognizedAt: now
    });

    await log.save();
    console.log("Successfully saved period-wise attendance:", log); // 🔍

    res.status(200).json({ message: `Period-wise attendance recorded for ${period}`, log });

  } catch (err) {
    console.error("Error logging periodwise attendance:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




// ─────────────────────────────────────────────────────────────────────────────
// CONDUCTED LECTURES — teacher sets which subjects ran today
// ─────────────────────────────────────────────────────────────────────────────

const conductedLecturesSchema = new mongoose.Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  periods: [String],                      // e.g. ['IoT', 'AI', 'Mobile Computing']
  updatedAt: { type: Date, default: Date.now }
});

const ConductedLectures = mongoose.model('ConductedLectures', conductedLecturesSchema);

// POST /api/conducted-lectures — teacher sets (or updates) conducted lectures for a date
app.post('/api/conducted-lectures', async (req, res) => {
  const { date, periods } = req.body;
  if (!date || !Array.isArray(periods) || periods.length === 0) {
    return res.status(400).json({ message: 'date and periods[] are required' });
  }
  try {
    const record = await ConductedLectures.findOneAndUpdate(
      { date },
      { periods, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Conducted lectures saved', record });
  } catch (err) {
    console.error('Error saving conducted lectures:', err);
    res.status(500).json({ message: 'Failed to save conducted lectures' });
  }
});

// GET /api/conducted-lectures/today — returns today's conducted lectures
app.get('/api/conducted-lectures/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await ConductedLectures.findOne({ date: today });
    res.json({ date: today, periods: record ? record.periods : [] });
  } catch (err) {
    console.error('Error fetching conducted lectures:', err);
    res.status(500).json({ message: 'Failed to fetch conducted lectures' });
  }
});

// GET /api/conducted-lectures/:date — returns conducted lectures for a specific date
app.get('/api/conducted-lectures/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const record = await ConductedLectures.findOne({ date });
    res.json({ date, periods: record ? record.periods : [] });
  } catch (err) {
    console.error('Error fetching conducted lectures:', err);
    res.status(500).json({ message: 'Failed to fetch conducted lectures' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BULK MARK — marks attendance for ALL conducted lectures for a student
// Called by: face recognition result AND QR code scan (when QR embeds all periods)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/attendance/mark-conducted', async (req, res) => {
  // periods[] can come from the request (QR payload) OR be fetched from today's schedule
  const { rollno, periods: requestedPeriods, date: requestedDate } = req.body;

  if (!rollno) {
    return res.status(400).json({ message: 'rollno is required' });
  }

  try {
    const student = await Student.findOne({ rollno });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Determine which periods to mark
    let periodsToMark = requestedPeriods;
    const today = requestedDate || new Date().toISOString().split('T')[0];

    if (!periodsToMark || periodsToMark.length === 0) {
      // Fall back to today's conducted lectures from DB
      const record = await ConductedLectures.findOne({ date: today });
      periodsToMark = record ? record.periods : [];
    }

    if (periodsToMark.length === 0) {
      return res.status(400).json({ message: 'No conducted lectures found for today. Please set them from the admin dashboard.' });
    }

    const dateStart = new Date(today);
    const dateEnd = new Date(today);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const results = [];

    for (const period of periodsToMark) {
      const existing = await PeriodwiseAttendanceLog.findOne({
        rollno,
        period,
        recognizedAt: { $gte: dateStart, $lt: dateEnd }
      });

      if (existing) {
        results.push({ period, status: 'already_marked' });
      } else {
        const log = new PeriodwiseAttendanceLog({
          rollno,
          name: student.name,
          course: student.course,
          period,
          recognizedAt: new Date()
        });
        await log.save();
        results.push({ period, status: 'marked' });
      }
    }

    // Also mark the daily attendance log (if not already done)
    const existingDaily = await AttendanceLog.findOne({
      rollno,
      course: student.course,
      recognizedAt: { $gte: dateStart, $lt: dateEnd }
    });
    if (!existingDaily) {
      const dailyLog = new AttendanceLog({
        rollno,
        name: student.name,
        course: student.course,
        recognizedAt: new Date()
      });
      await dailyLog.save();
    }

    const newlyMarked = results.filter(r => r.status === 'marked').length;
    const alreadyMarked = results.filter(r => r.status === 'already_marked').length;

    res.status(200).json({
      message: `Attendance marked for ${newlyMarked} lecture(s). ${alreadyMarked} already recorded.`,
      results
    });
  } catch (err) {
    console.error('Error in mark-conducted:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Time-based period function removed since it's now manually selected from the frontend

app.get('/api/periodwise-attendance', async (req, res) => {
  try {
    const logs = await PeriodwiseAttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch {
    console.log("Error fetching periodwise logs:", err);
    res.status(500).json({ message: "Failed to fetch periodwise attendance logs" });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
