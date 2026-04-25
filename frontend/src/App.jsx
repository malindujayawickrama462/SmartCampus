import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import OAuthCallback from './pages/OAuthCallback';
import Resources from './pages/Resources';
import Bookings from './pages/Bookings';
import AdminBookings from './pages/AdminBookings';
import Tickets from './pages/Tickets';
import AdminTickets from './pages/AdminTickets';
import ResourceManagement from './pages/ResourceManagement';
import Notifications from './pages/Notifications';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      <div className="pl-64">
        <main className="min-h-screen bg-surface-container p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') return <Navigate to="/" />;
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      <div className="pl-64">
        <main className="min-h-screen bg-surface-container p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth2/callback" element={<OAuthCallback />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
            <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/resources" element={<AdminRoute><ResourceManagement /></AdminRoute>} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;