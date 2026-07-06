import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const StudentLogin = () => {
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!rollNo || !name) {
      alert("Please enter Roll No and Name");
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollno: rollNo, name })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Login successful! Welcome " + data.student.name);
        localStorage.setItem('studentRollNo', data.student.rollno);
        localStorage.setItem('studentName', data.student.name);
        navigate('/student-dashboard');
      } else {
        alert(data.message || "Login failed!");
      }
    } catch (err) {
      alert("Login failed! Could not reach the server.");
      console.error(err);
    }
  };

  return (
    <div className="bg-split font-sans text-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-blue-700/80 backdrop-blur-xl">
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-linear-to-br from-primary-dim to-primary bg-clip-text text-transparent tracking-tight">Attend</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-white/70 hover:text-white transition-colors duration-300 text-sm uppercase tracking-widest font-bold" href="#">Portal Info</a>
            <a className="text-white/70 hover:text-white transition-colors duration-300 text-sm uppercase tracking-widest font-bold" href="#">Support</a>
          </div>
        </nav>
      </header>

      <main className="relative flex items-center justify-center w-full max-w-7xl">
        {/* Ethereal Background Accents */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary-dim/10 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] -z-10"></div>

        {/* Login Container */}
        <div className="w-full max-w-md relative">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-[#f0f0fd] tracking-tighter mb-3">
              Welcome <span className="text-[#b6a0ff]">Back</span>
            </h1>
            <p className="text-on-surface-variant font-medium">Access your educational dashboard</p>
          </div>

          {/* Glassmorphic Card */}
          <div className="bg-surface-bright/40 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden border border-outline-variant/30">
            {/* Aura Glow inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px]"></div>
            <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Roll No</label>
                <div className="relative group focus-within:shadow-[0_0_15px_rgba(0,227,253,0.1)] transition-shadow">
                  <div className="absolute inset-y-0 left-4 flex items-center text-outline pointer-events-none group-focus-within:text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <input
                    className="w-full bg-[#000000] border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-[#f0f0fd] placeholder-outline focus:outline-none focus:border-secondary/50 transition-all font-medium"
                    placeholder="Enter your roll number"
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Student Name</label>
                <div className="relative group focus-within:shadow-[0_0_15px_rgba(0,227,253,0.1)] transition-shadow">
                  <div className="absolute inset-y-0 left-4 flex items-center text-outline pointer-events-none group-focus-within:text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    className="w-full bg-[#000000] border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-[#f0f0fd] placeholder-outline focus:outline-none focus:border-secondary/50 transition-all font-medium"
                    placeholder="Full legal name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pt-4">
                <button className="w-full group relative overflow-hidden rounded-xl p-px transition-transform active:scale-95" type="submit">
                  <div className="absolute inset-0 bg-linear-to-r from-primary-dim via-secondary to-primary-dim opacity-50"></div>
                  <div className="relative bg-[#222532] rounded-[calc(0.75rem-1px)] py-4 flex items-center justify-center gap-2 hover:bg-transparent transition-colors">
                    <span className="font-bold text-lg bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:text-[#000000] transition-colors">
                      Login to Portal
                    </span>
                    <span className="material-symbols-outlined text-secondary group-hover:text-[#000000] transition-colors">arrow_forward</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLogin;
