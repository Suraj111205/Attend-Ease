# Attend-Ease
# Attend-Ease

### AI Powered Face Recognition Attendance Management System

![GitHub stars](https://img.shields.io/github/stars/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/Suraj111205/Attend-Ease?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/Suraj111205/Attend-Ease?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge\&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge\&logo=node.js)
![Python](https://img.shields.io/badge/Python-Flask-yellow?style=for-the-badge\&logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success?style=for-the-badge\&logo=mongodb)

---

## Project Overview

Attend-Ease is an AI-powered attendance management system that automates attendance using facial recognition technology. The application combines a React frontend, a Node.js backend, and a Python-based face recognition API to provide a seamless attendance management experience.

The system allows administrators to register students, manage attendance records, and monitor attendance, while students can securely log in to view their attendance history.

---

# Architecture

```text
                    +--------------------+
                    |     React Frontend |
                    +---------+----------+
                              |
                              |
                    REST API Requests
                              |
                              ▼
                 +------------------------+
                 |    Node.js Backend     |
                 |   (Express Server)     |
                 +------+-----------+-----+
                        |           |
                        |           |
                        ▼           ▼
             MongoDB Atlas      Python Flask API
             (Database)       (Face Recognition)
                                    |
                                    ▼
                             OpenCV + Face Recognition
```

---

# Project Workflow

```text
User Opens Website
        │
        ▼
Login/Register
        │
        ▼
Role Authentication
        │
 ┌──────┴─────────┐
 │                │
 ▼                ▼
Admin         Student
 │                │
 │                │
 ▼                ▼
Manage       View Attendance
Students
 │
 ▼
Register Face
 │
 ▼
Capture Image
 │
 ▼
Python Face Recognition
 │
 ▼
Attendance Marked
 │
 ▼
Stored in MongoDB
 │
 ▼
Displayed on Dashboard
```

---
```

---

# Environment Variables
#I have not implement this in my project as this is important regarding the security issue. You guys can do this.
Create a `.env` file inside the **server** folder.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

Never upload your `.env` file to GitHub.

---

# Python Dependencies

Install Python libraries before running the Python API.

```bash
pip install flask
pip install flask-cors
pip install opencv-python
pip install face_recognition
pip install numpy
pip install pillow
```

or

```bash
pip install -r requirements.txt
```

---

# Node Dependencies

Inside the **server** folder

```bash
npm install
```

Common packages include

* express
* cors
* mongoose
* dotenv
* bcrypt
* jsonwebtoken
* multer

---

# Frontend Dependencies

Inside **facefrontend**

```bash
npm install
```

Then start the development server.

```bash
npm run dev
```

---

# Complete Startup Guide

Open **three different Command Prompt windows**.

### Terminal 1

```bash
cd facefrontend

npm install

npm run dev
```

---

### Terminal 2

```bash
cd server

npm install

node server.js
```

---

### Terminal 3

```bash
cd python-face-api

pip install -r requirements.txt

python app.py
```

All three terminals should remain running while using the application.

---

# Default Ports

| Service        | Port                                |
| -------------- | ----------------------------------- |
| React Frontend | 5173                                |
| Node Backend   | 5000                                |
| Python API     | 5001 (or the configured Flask port) |
| MongoDB Atlas  | Cloud Database                      |

---

# MongoDB Atlas Setup

## Step 1

Create a free MongoDB Atlas account.

---

## Step 2

Create a new cluster.

---

## Step 3

Create a Database User.

```
Username : your_username

Password : your_password
```

---

## Step 4

Go to

Network Access

Click

Add IP Address

Add

```
0.0.0.0/0
```

Save changes.

---

## Step 5

Go to

Cluster

↓

Connect

↓

Drivers

↓

Copy Connection String

Replace

```
<username>

<password>
```

with your credentials.

Paste it into your `.env` file.

---

# Troubleshooting

## MongoDB Connection Failed

Check

* MongoDB URI
* Username
* Password
* Internet Connection
* IP Access List (0.0.0.0/0)

---

## Frontend Not Loading

Run

```bash
npm install
npm run dev
```

---

## Backend Not Starting

Run

```bash
npm install
node server.js
```

Ensure all required packages are installed.

---

## Python API Error

Install dependencies.

```bash
pip install -r requirements.txt
```

Check that Python is added to the system PATH.

---

## Camera Not Working

* Allow browser camera permissions.
* Close other applications using the webcam.
* Restart the browser.

---

# Folder Structure

```text
Attend-Ease/

├── facefrontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
├── python-face-api/
│   ├── app.py
│   ├── requirements.txt
│   └── face_data/
│
├── screenshots/
│
├── README.md
│
└── .gitignore
```

---

# Future Scope

* QR Code Attendance
* Face Mask Detection
* Liveness Detection
* Anti-Spoofing
* Attendance Analytics
* Email Notifications
* Mobile Application
* Cloud Deployment
* Multi-Camera Support
* Real-Time Attendance Dashboard

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

# License

This project is intended for educational and learning purposes.

---

# Contact

**Developer:** Suraj Mugatrao

GitHub: https://github.com/Suraj111205

If you found this project helpful, don't forget to ⭐ the repository.
