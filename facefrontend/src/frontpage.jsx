import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("Roll Number will appear here");
  const [recognizedStudentName, setRecognizedStudentName] = useState("Name will appear here");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [isAutoRecognizing, setIsAutoRecognizing] = useState(false); // Track auto mode
  const [selectedPeriod, setSelectedPeriod] = useState("System Programming & Compiler Design"); // Default
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Ref to hold the interval ID so we can clear it
  const intervalRef = useRef(null);
  // Ref to keep track of recently recognized Roll numbers to avoid spamming the database
  const recentlyRecognized = useRef(new Set());

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    const fetchPresentCount = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/periodwise-attendance");
        const today = new Date().toISOString().split('T')[0];
        // Filter unique Roll numbers present today
        const todayLogs = response.data.filter(log => {
          const logDate = new Date(log.recognizedAt).toISOString().split('T')[0];
          return logDate === today;
        });
        const uniqueStudents = new Set(todayLogs.map(log => log.rollno));
        setPresentCount(uniqueStudents.size);
      } catch (err) {
        console.error("Error fetching attendance logs:", err);
      }
    };

    fetchStudents();
    fetchPresentCount();
  }, []);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    getCamera();
  }, []);

  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const response = await axios.post("http://localhost:5000/recognize", { image: imageData });
      const rollno = response.data.rollno;

      setRecognizedName(rollno);

      const matchedStudent = students.find((student) => student.rollno === rollno);
      if (matchedStudent) {
        setRecognizedStudentName(matchedStudent.name);
      } else {
        setRecognizedStudentName("Not found");
      }

      const recognizedAt = new Date().toISOString(); // Always send recognizedAt
      const currentPeriod = selectedPeriod;

      if (!currentPeriod) {
        setAttendanceMessage("Please select a valid subject for attendance.");
        return;
      }

      // Prevent spamming the API and alerts if already recognized this session
      if (recentlyRecognized.current.has(rollno)) {
        setAttendanceMessage(`Already recognized ${rollno} for today.`);
        return;
      }

      // Submit period-wise attendance
      try {
        const res = await axios.post("http://localhost:5001/api/periodwise-attendance", {
          rollno,
          recognizedAt,
          period: currentPeriod
        });

        // Add to Set to prevent multiple alerts in auto-mode
        recentlyRecognized.current.add(rollno);

        alert(res.data.message);
        setAttendanceMessage(`${currentPeriod} attendance successfully recorded.`);

        // Re-fetch the present count to update the UI immediately
        try {
          const countResponse = await axios.get("http://localhost:5001/api/periodwise-attendance");
          const today = new Date().toISOString().split('T')[0];
          const todayLogs = countResponse.data.filter(log => {
            const logDate = new Date(log.recognizedAt).toISOString().split('T')[0];
            return logDate === today;
          });
          const uniqueStudents = new Set(todayLogs.map(log => log.rollno));
          setPresentCount(uniqueStudents.size);
        } catch (fetchErr) {
          console.error("Error updating present count:", fetchErr);
        }
      } catch (err) {
        // If it's a 400 'already recorded', we still want to add it to the Set to stop spamming
        if (err.response?.status === 400 && err.response?.data?.message?.includes("already recorded")) {
          recentlyRecognized.current.add(rollno);
        }

        if (!isAutoRecognizing) {
          alert(err.response?.data?.message || "Something went wrong");
        }
        setAttendanceMessage(err.response?.data?.message || "Failed to record attendance.");
      }

    } catch (err) {
      console.error(err);
      if (!isAutoRecognizing) {
        setRecognizedName("Error recognizing");
        setRecognizedStudentName("Recognition failed");
      }
      setAttendanceMessage("Error in recognition or attendance.");
    }
  };

  // Turn Auto-Recognition On or Off
  const toggleAutoRecognition = () => {
    if (isAutoRecognizing) {
      // Turn it off
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsAutoRecognizing(false);
      setAttendanceMessage("Auto-recognition paused.");
    } else {
      // Turn it on: trigger every 3 seconds
      setIsAutoRecognizing(true);
      setAttendanceMessage("Auto-recognition started...");
      intervalRef.current = setInterval(() => {
        handleRecognize();
      }, 3000);
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);



  function getCurrentPeriod() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();


    if (hours >= 9 && hours < 10) {
      return 'System Programming & Compiler Design';
    } else if (hours === 10 && minutes >= 10) {
      return 'Internet Of Things';
    } else if (hours === 11 && minutes >= 20) {
      return 'Mobile Computing';
    } else if (hours === 12 && minutes >= 30) {
      return 'Cryptography & System Security';
    } else if (hours === 21 && minutes >= 15) { // Added this to cover any time after 6 PM for testing
      return 'Artificial Intelligence';
    }
    return 'No Period';
  }





  return (
<div className="absolute inset-0 -z-10 h-full w-full bg-linear-to-r from-purple-900 via-black to-indigo-900 px-5 py-24">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col sm:flex-row gap-5 w-full h-[80vh] p-5">
          <div className="w-1/2 h-full flex items-center justify-center">
            <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-[#E8E4FF]">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
            </div>
          </div>

          <div className="w-1/2 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-md mb-6">
              Attend-Ease
            </h1>

            {/* Dropdown for selecting subject to teach */}
            <div className="mb-4 w-full flex flex-col items-center">
              <label htmlFor="period-select" className="text-gray-200 font-semibold mb-2">Select Active Class Period:</label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-[200px] border border-gray-600 rounded-lg p-2 bg-[#F7F7F7] text-gray-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#8678f9] outline-none shadow-md"
              >
                <option value="System Programming & Compiler Design">System Programming & Compiler Design</option>
                <option value="Internet Of Things">Internet Of Things</option>
                <option value="Mobile Computing">Mobile Computing</option>
                <option value="Cryptography & System Security">Cryptography & System Security</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
              </select>
            </div>

            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized Roll No: <span className="text-emerald-400 font-bold">{recognizedName}</span>
            </div>
            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized Student Name: <span className="text-emerald-400 font-bold">{recognizedStudentName}</span>
            </div>
            <div className="mt-5 text-2xl font-medium text-gray-300">
              Students Present Today: <span className="text-blue-400 font-bold">{presentCount}</span>
            </div>

            {/* Display the attendance message */}
            {attendanceMessage && (
              <div className="mt-5 text-lg font-medium text-yellow-300">
                {attendanceMessage}
              </div>
            )}
            <div className="flex flex-row gap-3">
              <button
                onClick={toggleAutoRecognition}
                className={`mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 px-6 font-medium text-gray-950 duration-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50 ${isAutoRecognizing ? 'bg-red-300 hover:bg-red-400' : 'bg-linear-to-r from-green-300 via-emerald-200 to-teal-300 hover:opacity-90'}`}
              >
                {isAutoRecognizing ? "Stop Auto-Recognition" : "Start Auto-Recognition"}
              </button>


              <button
                onClick={handleRecognize}
                disabled={isAutoRecognizing}
                className={`mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 px-6 font-medium text-gray-950 duration-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50 ${isAutoRecognizing ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-linear-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-size-[200%_200%] bg-position-[0%_0%] hover:bg-position-[100%_200%]'}`}
              >
                Recognize Face Manually
              </button>

              <Link to="/Signin">
                <button className="mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 bg-linear-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-size-[200%_200%] bg-position-[0%_0%] px-6 font-medium text-gray-950 duration-500 hover:bg-position-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50">
                  Dashboard
                </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Front;
