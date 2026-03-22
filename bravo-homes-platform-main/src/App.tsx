import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './lib/i18n';

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/client" element={<ProtectedRoute allowedRoles={['cliente']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/partner" element={<ProtectedRoute allowedRoles={['parceiro']}><PartnerDashboard /></ProtectedRoute>} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/lp/bathroom/:city" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}
