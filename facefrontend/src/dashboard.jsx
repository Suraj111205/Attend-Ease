import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaSignOutAlt } from 'react-icons/fa';
import { FaUserGraduate, FaClipboardList, FaUsers, FaClock } from "react-icons/fa";
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";

const ALL_SUBJECTS = [
  'System Programming & Compiler Design',
  'Internet Of Things',
  'Mobile Computing',
  'Cryptography & System Security',
  'Artificial Intelligence'
];

const Dashboard = () => {
    const [attendance, setAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedCourse, setSelectedCourse] = useState("All");

    // Conducted lectures state
    const [conductedPeriods, setConductedPeriods] = useState([]);
    const [savedConductedPeriods, setSavedConductedPeriods] = useState([]);
    const [conductedSaving, setConductedSaving] = useState(false);
    const [conductedMsg, setConductedMsg] = useState('');

    // QR embeds ALL currently conducted periods
    const qrDataPayload = JSON.stringify({
        type: 'conducted-attendance',
        periods: savedConductedPeriods,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
    });

    const today = new Date().toISOString().split('T')[0];

    const presentToday = attendance.filter((student) => {
        const attendedDate = new Date(student.recognizedAt).toISOString().split('T')[0];
        return attendedDate === today;
    });

    const handleManualAttendance = async () => {
        const name = document.querySelector('input[name="manual_name"]').value;
        const rollno = document.querySelector('input[name="manual_rollno"]').value;
        const course = document.querySelector('input[name="manual_course"]').value;
        const recognizedAtInput = document.querySelector('input[name="recognizedAt"]').value;

        try {
            const res = await axios.post(`${import.meta.env.VITE_NODE_SERVER}/api/attendance`, {
                name,
                rollno,
                course,
                recognizedAt: recognizedAtInput || undefined
            });
            alert(res.data.message);
        } catch (err) {
            alert(err.response?.data?.message || "Something went wrong");
        }
    };

    const totalStudents = students.length;
    const absentStudents = totalStudents - presentToday.length;

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_NODE_SERVER}/api/periodwise-attendance`);
                setAttendance(response.data);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            }
        };

        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_NODE_SERVER}/api/students`);
                setStudents(response.data);
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };

        const fetchConductedLectures = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_NODE_SERVER}/api/conducted-lectures/today`);
                setSavedConductedPeriods(response.data.periods || []);
                setConductedPeriods(response.data.periods || []);
            } catch (err) {
                console.error("Error fetching conducted lectures:", err);
            }
        };

        fetchAttendance();
        fetchStudents();
        fetchConductedLectures();
    }, []);

    const toggleConductedPeriod = (subject) => {
        setConductedPeriods(prev =>
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };

    const saveConductedLectures = async () => {
        if (conductedPeriods.length === 0) {
            alert('Please select at least one conducted lecture.');
            return;
        }
        setConductedSaving(true);
        setConductedMsg('');
        try {
            const today = new Date().toISOString().split('T')[0];
            await axios.post(`${import.meta.env.VITE_NODE_SERVER}/api/conducted-lectures`, {
                date: today,
                periods: conductedPeriods
            });
            setSavedConductedPeriods([...conductedPeriods]);
            setConductedMsg(`✅ Saved! QR now covers ${conductedPeriods.length} lecture(s).`);
        } catch (err) {
            setConductedMsg('❌ Failed to save. Try again.');
            console.error(err);
        } finally {
            setConductedSaving(false);
        }
    };

    const courseList = ["All", ...new Set(attendance.map((student) => student.course))];

    const filteredAttendance = selectedCourse === "All"
        ? attendance
        : attendance.filter((student) => student.course === selectedCourse);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAttendance = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="min-h-screen p-4 bg-split">
            <div className="flex flex-col lg:flex-row gap-6">

                <div className="w-full lg:w-64 bg-white shadow-xl rounded-2xl p-4 flex flex-col justify-between lg:min-h-[90vh]">
                    <div>
                        <h2 className="text-lg mt-5 font-bold text-center  mb-8">Third Year Computer Engineering</h2>
                        <div className="flex overflow-x-auto lg:flex-col gap-3 lg:gap-5 pb-2 lg:pb-0 hide-scrollbar flex-nowrap">
                            <Link to="/dashboard" className="shrink-0">
                                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                                    <FaHome className="text-purple-600" />
                                    <span>Home</span>
                                </button>
                            </Link>
                            <Link to="/Addstudent" className="shrink-0">
                                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                                    <FaUser className="text-black" />
                                    <span>Add Students</span>
                                </button>
                            </Link>
                            <Link to="/Enrolled" className="shrink-0">
                                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                                    <FaFileAlt className="text-red-500" />
                                    <span>Enrolled</span>
                                </button>
                            </Link>
                            <Link to="/Period" className="shrink-0">
                                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                                    <FaClock className="text-green-500" />
                                    <span>Period Wise</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-4 lg:mt-0">
                        <button onClick={() => { window.location.href = '/signin'; }} className="w-full py-2 rounded-xl bg-[#1E2A78] text-white shadow-md flex items-center justify-center space-x-2 hover:bg-[#16239D] active:bg-[#0f1c77] transition-all duration-300">
                            <FaSignOutAlt />
                            <span>LogOut</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-6 gap-4">
                        <div>
                            <p className="text-lg font-semibold">Class Co-ordinator : Mr. Kamble S.A.</p>
                            <h1 className="text-lg font-semibold">Dashboard</h1>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {/* Total Students */}
                        <div className="bg-white rounded-[1.1rem] p-4 shadow-sm space-y-2.5 flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <div className="w-9 h-9 bg-green-100 text-green-600 flex items-center justify-center rounded-md">
                                    <FaUserGraduate className="text-lg" />
                                </div>
                                <p className="text-xs font-semibold text-gray-600">TOTAL</p>
                                <p className="text-green-600 text-base font-semibold mt-1">Students in the class</p>
                            </div>
                            <h3 className="text-5xl font-bold text-gray-800 px-6">{totalStudents}</h3>
                        </div>

                        {/* Present Today */}
                        <div className="bg-white rounded-[1.1rem] p-4 shadow-sm space-y-2.5 flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <div className="w-9 h-9 bg-blue-100 text-blue-600 flex items-center justify-center rounded-md">
                                    <FaClipboardList className="text-lg" />
                                </div>
                                <p className="text-xs font-semibold text-gray-600">TOTAL</p>
                                <p className="text-blue-600 text-base font-semibold mt-1">Students Present Today</p>
                            </div>
                            <p className="text-5xl font-bold text-gray-800 px-6">{presentToday.length}</p>
                        </div>

                        {/* Absent Today */}
                        <div className="bg-white rounded-[1.1rem] p-4 shadow-sm space-y-2.5 flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <div className="w-9 h-9 bg-red-100 text-red-600 flex items-center justify-center rounded-md">
                                    <FaUsers className="text-lg" />
                                </div>
                                <p className="text-xs font-semibold text-gray-600">TOTAL</p>
                                <p className="text-red-600 text-base font-semibold mt-1">Students Absent Today</p>
                            </div>
                            <h3 className="text-5xl font-bold text-gray-800 px-6">{absentStudents}</h3>
                        </div>
                    </div>

                    <div className="w-full flex flex-col xl:flex-row gap-5">

                        <div className="bg-white w-full xl:w-1/2 rounded-[1.1rem] shadow-md p-4">
                            <h3 className="text-gray-800 ml-2 text-lg font-bold mb-2">Logs of Student Attendance</h3>
                            <div className="flex justify-end mb-2">
                                <label htmlFor="filter" className="text-sm text-gray-700 mr-2 font-semibold">Sort by Class:</label>
                                <select
                                    id="filter"
                                    value={selectedCourse}
                                    onChange={(e) => {
                                        setSelectedCourse(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border px-3 py-1 rounded-md text-sm"
                                >
                                    {courseList.map((course, idx) => (
                                        <option key={idx} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="overflow-x-auto mt-2">
                                <table className="min-w-full table-auto border-separate border-spacing-y-2 text-sm text-gray-900">
                                    <thead>
                                        <tr className="bg-[#F7F7F7] text-gray-900">
                                            <th className="text-left px-4 py-3 rounded-l-lg">Name</th>
                                            <th className="text-left px-4 py-3">Roll No</th>
                                            <th className="text-left px-4 py-3">Class</th>
                                            <th className="text-left px-4 py-3 rounded-r-lg">Timings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentAttendance.length > 0 ? (
                                            currentAttendance.map((student, index) => (
                                                <tr key={index} className="hover:bg-[#f0f4f8] transition-colors duration-200 rounded-lg">
                                                    <td className="px-4 py-3">{student.name}</td>
                                                    <td className="px-4 py-3">{student.rollno}</td>
                                                    <td className="px-4 py-3">{student.course}</td>
                                                    <td className="px-4 py-3">{new Date(student.recognizedAt).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center text-gray-400">No attendance logs available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="bg-white w-full xl:w-1/2 rounded-[1.2rem] shadow-md p-6 flex flex-col gap-3">
                            <h3 className="text-gray-800 text-lg font-bold">Teacher's QR Attendance Portal</h3>

                            {/* Conducted Lectures Selector */}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Select Conducted Lectures Today</p>
                                <div className="flex flex-col gap-1.5">
                                    {ALL_SUBJECTS.map(subject => (
                                        <label key={subject} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-blue-700">
                                            <input
                                                type="checkbox"
                                                checked={conductedPeriods.includes(subject)}
                                                onChange={() => toggleConductedPeriod(subject)}
                                                className="accent-blue-600 w-4 h-4"
                                            />
                                            {subject}
                                        </label>
                                    ))}
                                </div>
                                <button
                                    onClick={saveConductedLectures}
                                    disabled={conductedSaving}
                                    className="mt-3 w-full py-1.5 bg-[#1E2A78] text-white text-xs font-bold rounded-lg hover:bg-[#16239D] transition disabled:opacity-50"
                                >
                                    {conductedSaving ? 'Saving...' : 'Save & Update QR'}
                                </button>
                                {conductedMsg && <p className="text-xs mt-1 text-center font-medium text-gray-600">{conductedMsg}</p>}
                            </div>

                            {/* QR Code — embeds all conducted periods */}
                            <div className="flex flex-col items-center gap-2">
                                {savedConductedPeriods.length > 0 ? (
                                    <>
                                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                            <QRCode value={qrDataPayload} size={120} />
                                        </div>
                                        <p className="text-[11px] text-gray-500 text-center font-medium">
                                            Students scan once → marked for <strong>{savedConductedPeriods.length}</strong> lecture(s)
                                        </p>
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {savedConductedPeriods.map(p => (
                                                <span key={p} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p}</span>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        Select lectures above and click<br />"Save &amp; Update QR" to generate.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="text-center text-gray-600 mt-4">
                        <span
                            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                            className={`mr-2 cursor-pointer hover:underline ${currentPage === 1 ? 'cursor-not-allowed text-gray-300' : ''}`}
                        >
                            Prev
                        </span>
                        <span className="font-semibold">Page {currentPage}</span>
                        <span
                            onClick={() => indexOfLastItem < filteredAttendance.length && paginate(currentPage + 1)}
                            className={`ml-2 cursor-pointer hover:underline ${indexOfLastItem >= filteredAttendance.length ? 'cursor-not-allowed text-gray-300' : ''}`}
                        >
                            Next
                        </span>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 mt-6">
                        © 2026 <span className="font-semibold text-gray-700">RMCET</span> for a better web.
                        <div className="text-right text-xs underline mt-1 cursor-pointer">Ambav</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


