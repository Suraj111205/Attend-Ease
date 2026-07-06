import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Front from './frontpage';
import Dashboard from './dashboard';
import Addstudent from './Addstudent';
import Enrolled from './Enrolled';
import Signin from './signin';
import Period from './period';
import StudentLogin from './StudentLogin';
import StudentDashboardNew from './StudentDashboardNew';

function App() {
  return (
    <Router>
  <Routes>
    <Route path="/" element={<Front />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/Addstudent" element={<Addstudent/>}/>
    <Route path="/Enrolled" element={<Enrolled/>}/>
    <Route path="/Signin" element={<Signin/>}/>
    <Route path="/Period" element={<Period/>}/>
    <Route path="/student-login" element={<StudentLogin/>}/>
    <Route path="/student-dashboard" element={<StudentDashboardNew/>}/>
  </Routes>
</Router>

  );
}

export default App;
