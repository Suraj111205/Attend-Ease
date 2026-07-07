import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_NODE_SERVER}/api/students`),
          axios.get(`${import.meta.env.VITE_NODE_SERVER}/api/attendance`),
        ]);

        const sortedStudents = studentsRes.data.sort((a, b) => 
          String(a.rollno).localeCompare(String(b.rollno), undefined, { numeric: true })
        );
        setStudents(sortedStudents);
        setAttendanceLogs(attendanceRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchStudentsAndAttendance();
  }, []);

  const todayDate = new Date().toISOString().split("T")[0];

  const getAttendanceStatus = (rollno) => {
    const hasLogToday = attendanceLogs.some(log => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return log.rollno === rollno && logDate === todayDate;
    });
    return hasLogToday ? "Present" : "Absent";
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (!query) {
      setFilteredSuggestions([]);
    } else {
      const suggestions = students.filter((student) => {
        const nameMatch = student.name?.toLowerCase().includes(query);
        const rollnoMatch = student.rollno?.toLowerCase().includes(query);
        return nameMatch || rollnoMatch;
      });
      setFilteredSuggestions(suggestions);
    }
  };

  const handleSuggestionClick = (student) => {
    setSelectedStudent(student);
    setSearch('');
    setFilteredSuggestions([]);
  };

  const closeModal = () => setSelectedStudent(null);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course enrollment and its logs?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_NODE_SERVER}/api/students/${id}`);
        setStudents(students.filter(student => student._id !== id));
      } catch (err) {
        console.error("Error deleting student:", err);
        alert(`Failed to delete student: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen p-4 bg-split relative">
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <button onClick={closeModal} className="absolute top-2 right-3 text-xl text-gray-600 hover:text-black">
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Student Details</h2>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>Roll No:</strong> {selectedStudent.rollno}</p>
              <p><strong>Age:</strong> {selectedStudent.age}</p>
              <p><strong>Course:</strong> {selectedStudent.course}</p>
              <p><strong>Phone:</strong> {selectedStudent.phone}</p>
              <p><strong>Enrolled At:</strong> {new Date(selectedStudent.enrolledAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white shadow-xl rounded-2xl p-4 flex flex-col justify-between lg:min-h-[90vh]">
          <div>
            <h2 className="text-xl font-semibold text-center mb-6">Admin Page</h2>
            <div className="flex overflow-x-auto lg:flex-col gap-3 lg:gap-5 pb-2 lg:pb-0 hide-scrollbar flex-nowrap">
              <Link to="/dashboard" className="shrink-0">
                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                  <FaHome className="text-purple-600" />
                  <span>Home</span>
                </button>
              </Link>
              <Link to="/Addstudent" className="shrink-0">
                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                  <FaUser className="text-black" />
                  <span>Add Students</span>
                </button>
              </Link>
              <Link to="/Enrolled" className="shrink-0">
                <button className="flex items-center space-x-2 whitespace-nowrap lg:w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 bg-gray-50">
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
            <button onClick={() => { window.location.href = '/signin'; }} className="w-full py-2 rounded-xl bg-[#1E2A78] text-white shadow-md flex items-center justify-center space-x-2 hover:bg-[#16239D]">
              <FaSignOutAlt />
              <span>LogOut</span>
            </button>
          </div>

        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-6 gap-4">
            <div>
              <p>Pages / Enrolled</p>
              <h1 className="text-lg font-semibold">Enrolled Students</h1>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Student Here"
                value={search}
                onChange={handleSearchChange}
                className="text-gray-900 placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2 focus:ring-2 focus:ring-blue-500 w-full max-w-sm sm:w-80"
              />
              {filteredSuggestions.length > 0 && (
                <div className="absolute w-full mt-1 bg-white shadow-lg rounded-lg max-h-60 overflow-auto z-10">
                  <ul className="text-sm text-gray-800">
                    {filteredSuggestions.map((student) => (
                      <li
                        key={student._id}
                        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSuggestionClick(student)}
                      >
                        {student.name} ({student.rollno})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-[1.1rem] shadow-md p-4">
            <h1 className="text-gray-900 ml-2 font-bold">List of Enrolled Students</h1>
            <div className="overflow-x-auto mt-5">
              <table className="min-w-full table-auto border-separate border-spacing-y-2 text-sm text-gray-900">
                <thead>
                  <tr className="bg-[#F7F7F7] text-gray-900">
                    <th className="text-left px-4 py-3 rounded-l-lg">Name</th>
                    <th className="text-left px-4 py-3">Roll No</th>
                    <th className="text-left px-4 py-3">Age</th>
                    <th className="text-left px-4 py-3">Class</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Enrolled At</th>
                    {/* <th className="text-left px-4 py-3">Status</th>  */}
                    <th className="text-center px-4 py-3 rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-[#f0f4f8] transition duration-200">
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3">{student.rollno}</td>
                        <td className="px-4 py-3">{student.age}</td>
                        <td className="px-4 py-3">{student.course}</td>
                        <td className="px-4 py-3">{student.phone}</td>
                        <td className="px-4 py-3">{new Date(student.enrolledAt).toLocaleDateString()}</td>
                        {/* <td className="px-4 py-3 font-semibold">
                          <span className={getAttendanceStatus(student.rollno) === "Present" ? "text-green-600" : "text-red-500"}>
                            {getAttendanceStatus(student.rollno)}
                          </span>
                        </td> */}
                        <td className="px-4 py-3 text-center rounded-r-lg">
                          <button onClick={() => handleDelete(student._id)} className="text-red-500 hover:text-red-700 transition" title="Delete Student Enrollment">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-gray-500">No students enrolled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrolled;


