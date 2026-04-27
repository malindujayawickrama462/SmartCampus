import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Calendar, LayoutGrid, AlertCircle, ShieldCheck, ClipboardList, Bell, User, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);

  // Poll unread count every 30s as a fallback
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || res.data.unreadCount || 0); 
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Native WebSocket STOMP — real-time toast the moment a notification arrives
  useEffect(() => {
    if (!user?.id) return;

    let ws;
    let reconnectTimer;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8081/ws/websocket');
        wsRef.current = ws;

        ws.onopen = () => {
          // Send STOMP CONNECT frame
          ws.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0');
        };

        ws.onmessage = (evt) => {
          const data = evt.data;
          if (data.startsWith('CONNECTED')) {
            // Subscribe to this user's personal topic
            ws.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/notifications/${user.id}\n\n\0`);
            return;
          }
          if (data.startsWith('MESSAGE')) {
            const bodyStart = data.indexOf('\n\n');
            if (bodyStart !== -1) {
              try {
                const json = JSON.parse(data.slice(bodyStart + 2).replace('\0', ''));
                toast.success(json.message || 'New notification', { duration: 5000 });
                setUnreadCount(prev => prev + 1);
              } catch (_) { /* ignore malformed frames */ }
            }
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(() => {
            if (wsRef.current !== null) connect();
          }, 5000);
        };

        ws.onerror = () => ws.close();
      } catch (_) { /* WebSocket not available in this environment */ }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current = null;
      if (ws) ws.close();
    };
  }, [user?.id]);

  const handleLogout = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Top Header with Notifications */}
      <div className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#000a1e] text-white z-50 flex flex-col py-8">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-bold tracking-tight">Operations Hub</h1>
          <p className="text-xs text-[#515f74] font-semibold tracking-widest uppercase mt-1">Academic Monolith</p>
        </div>

        <nav className="flex-1 space-y-1">
          <Link to="/" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <Home className="mr-3 w-4 h-4" />
            <span className="font-semibold text-sm">Dashboard</span>
          </Link>
          <Link to="/resources" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <LayoutGrid className="mr-3 w-4 h-4" />
            <span className="font-semibold text-sm">Catalogue</span>
          </Link>
          <Link to="/bookings" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <Calendar className="mr-3 w-4 h-4" />
            <span className="font-semibold text-sm">Bookings</span>
          </Link>
          <Link to="/tickets" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <AlertCircle className="mr-3 w-4 h-4" />
            <span className="font-semibold text-sm">Incidents</span>
          </Link>
          <Link to="/notifications" className="flex items-center justify-between px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <div className="flex items-center">
              <Bell className="mr-3 w-4 h-4" />
              <span className="font-semibold text-sm">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>

          {user?.role === 'ADMIN' && (
            <>
              <div className="mx-6 my-2 border-t border-white/10" />
              <Link to="/admin/bookings" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
                <ClipboardList className="mr-3 w-4 h-4" />
                <span className="font-semibold text-sm">Manage Bookings</span>
              </Link>
              <Link to="/admin/tickets" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
                <AlertCircle className="mr-3 w-4 h-4" />
                <span className="font-semibold text-sm">Manage Incidents</span>
              </Link>
              <Link to="/admin/resources" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
                <ShieldCheck className="mr-3 w-4 h-4" />
                <span className="font-semibold text-sm">Manage Resources</span>
              </Link>
              <Link to="/admin/users" className="flex items-center px-6 py-3 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
                <Users className="mr-3 w-4 h-4" />
                <span className="font-semibold text-sm">Manage Users</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto px-6 pt-6 border-t border-white/10 space-y-2">
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-[#515f74] hover:text-white hover:bg-white/5 rounded-lg transition">
            <User className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Profile'}</p>
              <p className="text-xs text-[#515f74] truncate">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-b from-blue-600 to-blue-800 text-white py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
