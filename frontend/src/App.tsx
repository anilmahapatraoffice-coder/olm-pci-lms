import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLang } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursePage from './pages/CoursePage';
import AssessmentPage from './pages/AssessmentPage';
import SelfCertification from './pages/SelfCertification';
import CertificatePage from './pages/CertificatePage';
import Admin from './pages/Admin';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <div className="footer-logos">
        <img src="/logos/odisha-logo.png" alt="Odisha" />
        <img src="/logos/olm-logo.png" alt="OLM" />
        <img src="/logos/pci-logo.png" alt="PCI" />
      </div>
      <p>{t.footer_text}</p>
    </footer>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/course/:id" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
          <Route path="/assessment/:id" element={<PrivateRoute><AssessmentPage /></PrivateRoute>} />
          <Route path="/certify/:courseId" element={<PrivateRoute><SelfCertification /></PrivateRoute>} />
          <Route path="/certificate/:courseId" element={<PrivateRoute><CertificatePage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}
