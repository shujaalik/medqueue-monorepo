import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClinicAdminDashboard from './pages/ClinicAdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PublicDisplay from './pages/PublicDisplay';
import PatientStatus from './pages/PatientStatus';
import Landing from './pages/Landing';
import SelfRegister from './pages/SelfRegister';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/display/:clinicId" element={<PublicDisplay />} />
            <Route path="/status/:clinicId/:token" element={<PatientStatus />} />
            <Route path="/register/:clinicId" element={<SelfRegister />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clinic-admin" 
              element={
                <ProtectedRoute allowedRoles={['ClinicAdmin']}>
                  <ClinicAdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/doctor" 
              element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/receptionist" 
              element={
                <ProtectedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
