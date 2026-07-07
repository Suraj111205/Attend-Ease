# Attend-Ease

### AI Powered Face Recognition & QR Code Attendance Management System

![GitHub stars](https://img.shields.io/github/stars/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/Suraj111205/Attend-Ease?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Python-Flask-yellow?style=for-the-badge&logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success?style=for-the-badge&logo=mongodb)

---

## Project Overview

Attend-Ease is an AI-powered attendance management system that automates attendance tracking using **facial recognition** and **QR code scanning**. The application combines a React frontend, a Node.js backend, and a Python-based face recognition API to provide a seamless attendance management experience.

The system allows administrators to register students, manage attendance records, generate QR codes for bulk attendance marking, and monitor attendance — while students can securely log in, scan a teacher's QR code, or view their full attendance history on a personal dashboard.

---

## Architecture

```text
                    +--------------------+
                    |     React Frontend |
                    +---------+----------+
                              |
                    REST API Requests
                              |
                              ▼
                 +------------------------+
                 |    Node.js Backend     |
                 |   (Express Server)     |
                 +------+-----------+-----+
                        |           |
                        ▼           ▼
             MongoDB Atlas      Python Flask API
             (Database)       (Face Recognition)
                                    |
                                    ▼
                             OpenCV (LBPH Model)
```

---

## Features

### 👤 Admin Features
- Admin sign up & sign in
- Register students (name, roll no, age, course, phone)
- Enroll student faces (captured via webcam)
- **Face Recognition** — real-time attendance marking via webcam
- **QR Code Generation** — generate a QR code embedding all today's conducted lectures
- Set which subjects were conducted today
- View all enrolled students and attendance logs
- Delete student enrollments

### 🎓 Student Features
- Student login (roll no + name)
- Personal attendance dashboard
- View period-wise and daily attendance
- **QR Code Scanning** — scan the teacher's QR code to mark attendance for all conducted lectures at once

---

## QR Code Attendance System

This is a key feature that allows bulk attendance marking without face recognition.

### How it works

```text
Teacher's Admin Dashboard
        │
        ▼
Select subjects conducted today
(e.g. IoT, AI, Mobile Computing)
        │
        ▼
Click "Save & Update QR"
        │
        ▼
QR Code is generated on screen
(embeds all selected subjects + date)
        │
        ▼
Student opens Student Dashboard
        │
        ▼
Clicks "Scan Teacher's QR" button
        │
        ▼
Student scans the displayed QR code
        │
        ▼
Attendance marked for ALL conducted
subjects in a single scan
        │
        ▼
Stored in MongoDB
        │
        ▼
Reflected on Student Dashboard
```

### QR Code Payload Format

The QR code contains a JSON payload:

```json
{
  "type": "conducted-attendance",
  "periods": ["IoT", "AI", "Mobile Computing"],
  "date": "2026-07-07"
}
```

> Legacy single-period QR codes (type `periodwise-attendance`) are also supported for backward compatibility.

### Packages used
- **Admin (QR Generator):** `react-qr-code`
- **Student (QR Scanner):** `@yudiel/react-qr-scanner`

---

## Project Workflow

```text
User Opens Website
        │
        ▼
Login / Register
        │
        ▼
Role Authentication
        │
 ┌──────┴─────────┐
 │                │
 ▼                ▼
Admin         Student
 │                │
 ▼                ▼
Manage       View Attendance
Students      Dashboard
 │                │
 ▼                ▼
Register     Scan Teacher's
 Face           QR Code
 │                │
 ▼                ▼
Capture       Attendance
 Image         Marked for
   │          All Subjects
   ▼
Python Face
Recognition
   │
   ▼
Attendance
  Marked
   │
   ▼
Stored in MongoDB
   │
   ▼
Displayed on Dashboard
```

---

## Environment Variables

> **Security Notice:** Never commit your `.env` files to GitHub. They are already added to `.gitignore`.

Three `.env` files are required. Use the `.env.example` files as templates.

### `server/.env`

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
PORT=5001
```

### `python-face-api/.env`

```env
NODE_SERVER=http://localhost:5001
FLASK_PORT=5000
```

### `facefrontend/.env`

```env
VITE_NODE_SERVER=http://localhost:5001
VITE_PYTHON_SERVER=http://localhost:5000
```

> Copy the corresponding `.env.example` file, rename it to `.env`, and fill in your values.

---

## Python Dependencies

Install Python libraries before running the Python API.

```bash
pip install flask
pip install flask-cors
pip install opencv-contrib-python
pip install numpy
pip install python-dotenv
pip install requests
```

or if a `requirements.txt` exists:

```bash
pip install -r requirements.txt
```

> **Note:** Use `opencv-contrib-python` (not `opencv-python`) — the LBPH face recognizer requires the `cv2.face` module which is only in the contrib build.

---

## Node Dependencies

From the **project root** (where `package.json` is):

```bash
npm install
```

Packages used:
- `express`
- `cors`
- `mongoose`
- `dotenv`
- `body-parser`
- `nodemon`

---

## Frontend Dependencies

Inside **facefrontend/**:

```bash
npm install
```

Then start the development server:

```bash
npm run dev
```

---

## Complete Startup Guide

Open **three separate terminal windows** from the project root `Attend-Ease/`.

### Terminal 1 — React Frontend

```bash
cd facefrontend
npm install
npm run dev
```

Runs at: `http://localhost:5173`

---

### Terminal 2 — Node.js Backend

```bash
npm install
npm run dev
```

Runs at: `http://localhost:5001`

---

### Terminal 3 — Python Face API

```bash
python python-face-api/app.py
```

Runs at: `http://localhost:5000`

> All three terminals must remain running while using the application.

---

## Default Ports

| Service        | Port  |
| -------------- | ----- |
| React Frontend | 5173  |
| Node Backend   | 5001  |
| Python API     | 5000  |
| MongoDB Atlas  | Cloud |

---

## MongoDB Atlas Setup

### Step 1
Create a free MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/).

### Step 2
Create a new cluster.

### Step 3
Create a Database User:
```
Username: your_username
Password: your_password
```

### Step 4
Go to **Network Access** → **Add IP Address** → Add `0.0.0.0/0` → Save.

### Step 5
Go to **Cluster** → **Connect** → **Drivers** → Copy the connection string.

Replace `<username>` and `<password>` with your credentials and paste into `server/.env` as `MONGO_URI`.

---

## Folder Structure

```text
Attend-Ease/
│
├── facefrontend/               ← React + Vite frontend
│   ├── src/
│   │   ├── frontpage.jsx       ← Face recognition page
│   │   ├── dashboard.jsx       ← Admin dashboard + QR generator
│   │   ├── StudentDashboardNew.jsx  ← Student dashboard + QR scanner
│   │   ├── Addstudent.jsx      ← Student enrollment
│   │   ├── Enrolled.jsx        ← Enrolled students list
│   │   ├── StudentLogin.jsx    ← Student login
│   │   └── signin.jsx          ← Admin login / signup
│   ├── .env                    ← Frontend env vars (not committed)
│   ├── .env.example            ← Template (safe to commit)
│   └── package.json
│
├── server/
│   ├── server.js               ← Express API server
│   ├── .env                    ← Server env vars (not committed)
│   └── .env.example            ← Template (safe to commit)
│
├── python-face-api/
│   ├── app.py                  ← Flask face recognition API
│   ├── faces/                  ← Enrolled face images (not committed)
│   ├── .env                    ← Python env vars (not committed)
│   └── .env.example            ← Template (safe to commit)
│
├── package.json                ← Root package (runs Node server)
├── .gitignore
└── README.md
```

---

## Troubleshooting

### MongoDB Connection Failed
- Check `MONGO_URI` in `server/.env`
- Verify username and password
- Check internet connection
- Ensure `0.0.0.0/0` is in the Atlas IP Access List

### Frontend Not Loading
```bash
cd facefrontend
npm install
npm run dev
```

### Backend Not Starting
```bash
npm install
npm run dev
```
Ensure `server/.env` exists with a valid `MONGO_URI`.

### Face Recognition Error — "No face images found for training"
No faces have been enrolled yet. Go to the **Add Student** page, fill in student details, and use the webcam to capture and save face images. Recognition will only work after at least one student's face is enrolled.

### Python API Error
```bash
pip install flask flask-cors opencv-contrib-python numpy python-dotenv requests
python python-face-api/app.py
```
Ensure you use `opencv-contrib-python` — the LBPH recognizer is not in the base `opencv-python` package.

### Camera Not Working
- Allow browser camera permissions
- Close other apps using the webcam
- Restart the browser

### QR Code Not Scanning
- Ensure the student dashboard page is open on a device with a working camera
- Make sure the teacher's QR code on screen is fully visible and not too small
- Try increasing screen brightness

---

## Future Scope

- Face Mask Detection
- Liveness Detection / Anti-Spoofing
- Attendance Analytics & Reports
- Email / SMS Notifications
- Mobile Application
- Cloud Deployment
- Multi-Camera Support
- Real-Time Attendance Dashboard

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## License

This project is intended for educational and learning purposes.

---

## Contact

**Developer:** Suraj Mugatrao

GitHub: https://github.com/Suraj111205

If you found this project helpful, don't forget to ⭐ the repository.
