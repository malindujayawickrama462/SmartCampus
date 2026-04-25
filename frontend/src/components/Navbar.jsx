import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Calendar, LayoutGrid, AlertCircle, ShieldCheck, ClipboardList, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#000a1e] text-white z-50 flex flex-col py-8">
      <div className="px-6 mb-12">
        <h1 className="text-xl font-bold tracking-tight">Operations Hub</h1>
        <p className="text-xs text-[#515f74] font-semibold tracking-widest uppercase mt-1">Academic Monolith</p>
      </div>

      <nav className="flex-1 space-y-2">
        <Link to="/" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
          <Home className="mr-3" />
          <span className="font-semibold text-sm">Dashboard</span>
        </Link>
        <Link to="/resources" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
          <LayoutGrid className="mr-3" />
          <span className="font-semibold text-sm">Catalogue</span>
        </Link>
        <Link to="/bookings" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
          <Calendar className="mr-3" />
          <span className="font-semibold text-sm">Bookings</span>
        </Link>
        <Link to="/tickets" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
          <AlertCircle className="mr-3" />
          <span className="font-semibold text-sm">Incidents</span>
        </Link>
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin/bookings" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
              <ClipboardList className="mr-3" />
              <span className="font-semibold text-sm">Manage Bookings</span>
            </Link>
            <Link to="/admin/tickets" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
              <AlertCircle className="mr-3" />
              <span className="font-semibold text-sm">Manage Incidents</span>
            </Link>
            <Link to="/admin/resources" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
              <ShieldCheck className="mr-3" />
              <span className="font-semibold text-sm">Manage Resources</span>
            </Link>
            <Link to="/admin/users" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
              <User className="mr-3" />
              <span className="font-semibold text-sm">Manage Users</span>
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto px-6 pt-6 border-t border-white/10 space-y-2">
        <button 
          onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-[#515f74] hover:text-white hover:bg-white/5 transition relative"
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button onClick={handleLogout} className="w-full bg-linear-to-b from-primary to-primary-container text-white py-2 rounded-xl font-semibold text-sm">
          Logout
        </button>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={() => setIsNotificationPanelOpen(false)} 
      />
    </aside>
  );
}

